use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::domain::change::{self, ChangeDenomination};
use crate::domain::currency::CurrencyStock;
use crate::domain::product::Product;
use crate::error::AppError;
use crate::repository::{currency_repo, product_repo, transaction_repo};

#[derive(Debug, Deserialize)]
pub struct PurchaseRequest {
    pub product_id: i32,
    /// Denominations inserted by the user: [(denomination, count)]
    pub inserted_money: Vec<(i32, i32)>,
}

#[derive(Debug, Serialize)]
pub struct PurchaseResponse {
    pub product_name: String,
    pub price: i32,
    pub amount_paid: i32,
    pub change_amount: i32,
    pub change_breakdown: Vec<ChangeDenomination>,
    pub transaction_id: i32,
}

// ---- Pure validation functions (unit-testable without DB) ----

/// Calculate total amount from inserted denominations.
pub fn calculate_total(inserted: &[(i32, i32)]) -> i32 {
    inserted.iter().map(|(d, c)| d * c).sum()
}

/// Validate that the product is in stock.
pub fn validate_stock(product: &Product) -> Result<(), AppError> {
    if product.stock_quantity <= 0 {
        return Err(AppError::OutOfStock);
    }
    Ok(())
}

/// Validate that the user has inserted enough money.
pub fn validate_credit(amount_paid: i32, price: i32) -> Result<(), AppError> {
    if amount_paid < price {
        return Err(AppError::InsufficientCredit);
    }
    Ok(())
}

/// Build a temporary stock that includes the money just inserted,
/// then attempt to make change.
pub fn calculate_change(
    change_amount: i32,
    currency_stock: &[CurrencyStock],
    inserted: &[(i32, i32)],
) -> Result<Vec<ChangeDenomination>, AppError> {
    let mut temp_stock = currency_stock.to_vec();
    for (denom, count) in inserted {
        if let Some(cs) = temp_stock.iter_mut().find(|s| s.denomination == *denom) {
            cs.count += count;
        }
    }

    change::make_change(change_amount, &temp_stock).ok_or(AppError::CannotMakeChange)
}

// ---- Orchestrator (requires DB) ----

pub async fn purchase(pool: &PgPool, req: PurchaseRequest) -> Result<PurchaseResponse, AppError> {
    // 1. Fetch product
    let product = product_repo::find_by_id(pool, req.product_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Product {} not found", req.product_id)))?;

    // 2. Validate stock
    validate_stock(&product)?;

    // 3. Calculate and validate credit
    let amount_paid = calculate_total(&req.inserted_money);
    validate_credit(amount_paid, product.price)?;

    let change_amount = amount_paid - product.price;

    // 4. Calculate change using current stock + inserted money
    let currency_stock = currency_repo::find_all(pool).await?;
    let change_breakdown = calculate_change(change_amount, &currency_stock, &req.inserted_money)?;

    // 5. Execute atomically in a DB transaction
    let mut tx = pool.begin().await?;

    product_repo::decrement_stock(&mut tx, product.id).await?;
    currency_repo::apply_purchase(&mut tx, &req.inserted_money, &change_breakdown).await?;
    let transaction =
        transaction_repo::create(&mut tx, product.id, amount_paid, change_amount).await?;

    tx.commit().await?;

    Ok(PurchaseResponse {
        product_name: product.name,
        price: product.price,
        amount_paid,
        change_amount,
        change_breakdown,
        transaction_id: transaction.id,
    })
}

// ---- Unit Tests ----

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::currency::CurrencyStock;
    use crate::domain::product::Product;

    fn make_product(price: i32, stock: i32) -> Product {
        Product {
            id: 1,
            name: "Test Cola".to_string(),
            price,
            stock_quantity: stock,
            image_url: None,
        }
    }

    fn make_stock(items: &[(i32, &str, i32)]) -> Vec<CurrencyStock> {
        items
            .iter()
            .map(|(d, t, c)| CurrencyStock {
                denomination: *d,
                currency_type: t.to_string(),
                count: *c,
            })
            .collect()
    }

    // -- calculate_total --

    #[test]
    fn test_calculate_total_single_denomination() {
        assert_eq!(calculate_total(&[(100, 2)]), 200);
    }

    #[test]
    fn test_calculate_total_mixed_denominations() {
        assert_eq!(calculate_total(&[(100, 1), (50, 1), (10, 2)]), 170);
    }

    #[test]
    fn test_calculate_total_empty() {
        assert_eq!(calculate_total(&[]), 0);
    }

    #[test]
    fn test_calculate_total_all_denominations() {
        let inserted = vec![
            (1, 1), (5, 1), (10, 1), (20, 1), (50, 1), (100, 1), (500, 1), (1000, 1),
        ];
        assert_eq!(calculate_total(&inserted), 1686);
    }

    // -- validate_stock --

    #[test]
    fn test_validate_stock_positive() {
        let p = make_product(20, 5);
        assert!(validate_stock(&p).is_ok());
    }

    #[test]
    fn test_validate_stock_zero() {
        let p = make_product(20, 0);
        assert!(matches!(validate_stock(&p), Err(AppError::OutOfStock)));
    }

    #[test]
    fn test_validate_stock_negative() {
        let p = make_product(20, -1);
        assert!(matches!(validate_stock(&p), Err(AppError::OutOfStock)));
    }

    // -- validate_credit --

    #[test]
    fn test_validate_credit_exact() {
        assert!(validate_credit(20, 20).is_ok());
    }

    #[test]
    fn test_validate_credit_overpay() {
        assert!(validate_credit(100, 20).is_ok());
    }

    #[test]
    fn test_validate_credit_insufficient() {
        assert!(matches!(
            validate_credit(10, 20),
            Err(AppError::InsufficientCredit)
        ));
    }

    // -- calculate_change --

    #[test]
    fn test_change_with_inserted_money_added_to_stock() {
        // Stock has no 50s, but user inserts a 50. Change of 50 should work.
        let stock = make_stock(&[(100, "note", 5), (50, "note", 0)]);
        let inserted = vec![(50, 2)]; // user inserts 2×50
        let result = calculate_change(50, &stock, &inserted).unwrap();
        assert_eq!(result[0].denomination, 50);
        assert_eq!(result[0].count, 1);
    }

    #[test]
    fn test_change_impossible_even_with_inserted() {
        let stock = make_stock(&[(100, "note", 0)]);
        let inserted = vec![(100, 1)];
        // Need 7 change, only 100s available
        assert!(matches!(
            calculate_change(7, &stock, &inserted),
            Err(AppError::CannotMakeChange)
        ));
    }

    #[test]
    fn test_change_zero_returns_empty() {
        let stock = make_stock(&[(10, "coin", 5)]);
        let result = calculate_change(0, &stock, &[]).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_change_exact_denomination_available() {
        let stock = make_stock(&[
            (1, "coin", 100),
            (5, "coin", 100),
            (10, "coin", 100),
            (20, "note", 50),
        ]);
        let result = calculate_change(35, &stock, &[]).unwrap();
        let total: i32 = result.iter().map(|r| r.denomination * r.count).sum();
        assert_eq!(total, 35);
    }
}
