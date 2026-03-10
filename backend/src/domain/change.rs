use crate::domain::currency::CurrencyStock;
use serde::Serialize;

/// Represents a single denomination used in change.
#[derive(Debug, Clone, Serialize)]
pub struct ChangeDenomination {
    pub denomination: i32,
    pub count: i32,
}

/// Greedy change-making algorithm.
///
/// Given a target amount and available currency stock (sorted descending by denomination),
/// returns the denominations and counts required, or None if exact change is impossible.
pub fn make_change(amount: i32, stock: &[CurrencyStock]) -> Option<Vec<ChangeDenomination>> {
    if amount == 0 {
        return Some(vec![]);
    }
    if amount < 0 {
        return None;
    }

    let mut remaining = amount;
    let mut result = Vec::new();

    // Sort stock descending by denomination
    let mut sorted_stock: Vec<&CurrencyStock> = stock.iter().collect();
    sorted_stock.sort_by(|a, b| b.denomination.cmp(&a.denomination));

    for cs in &sorted_stock {
        if remaining <= 0 {
            break;
        }
        if cs.denomination > remaining || cs.count == 0 {
            continue;
        }

        let max_needed = remaining / cs.denomination;
        let use_count = max_needed.min(cs.count);

        if use_count > 0 {
            remaining -= use_count * cs.denomination;
            result.push(ChangeDenomination {
                denomination: cs.denomination,
                count: use_count,
            });
        }
    }

    if remaining == 0 {
        Some(result)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn stock(items: &[(i32, &str, i32)]) -> Vec<CurrencyStock> {
        items
            .iter()
            .map(|(d, t, c)| CurrencyStock {
                denomination: *d,
                currency_type: t.to_string(),
                count: *c,
            })
            .collect()
    }

    fn full_stock() -> Vec<CurrencyStock> {
        stock(&[
            (1, "coin", 100),
            (5, "coin", 100),
            (10, "coin", 100),
            (20, "note", 50),
            (50, "note", 50),
            (100, "note", 50),
            (500, "note", 20),
            (1000, "note", 20),
        ])
    }

    #[test]
    fn test_zero_change_returns_empty() {
        let result = make_change(0, &full_stock());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_negative_amount_returns_none() {
        assert!(make_change(-5, &full_stock()).is_none());
    }

    #[test]
    fn test_simple_coin_change() {
        let s = stock(&[(1, "coin", 10), (5, "coin", 10), (10, "coin", 10)]);
        let result = make_change(17, &s).unwrap();
        assert_eq!(result[0].denomination, 10);
        assert_eq!(result[0].count, 1);
        assert_eq!(result[1].denomination, 5);
        assert_eq!(result[1].count, 1);
        assert_eq!(result[2].denomination, 1);
        assert_eq!(result[2].count, 2);
    }

    #[test]
    fn test_impossible_change_returns_none() {
        let s = stock(&[(10, "coin", 1)]);
        assert!(make_change(7, &s).is_none());
    }

    #[test]
    fn test_limited_stock_uses_fallback_denoms() {
        let s = stock(&[(10, "coin", 1), (5, "coin", 1), (1, "coin", 3)]);
        let result = make_change(18, &s).unwrap();
        // 10 + 5 + 1*3 = 18
        let total: i32 = result.iter().map(|r| r.denomination * r.count).sum();
        assert_eq!(total, 18);
        assert_eq!(result.len(), 3);
    }

    #[test]
    fn test_large_change_with_all_denominations() {
        let result = make_change(1986, &full_stock()).unwrap();
        let total: i32 = result.iter().map(|r| r.denomination * r.count).sum();
        assert_eq!(total, 1986);
        // Should use: 1000*1 + 500*1 + 100*4 + 50*1 + 20*1 + 10*1 + 5*1 + 1*1
        assert_eq!(result[0].denomination, 1000);
        assert_eq!(result[0].count, 1);
        assert_eq!(result[1].denomination, 500);
        assert_eq!(result[1].count, 1);
    }

    #[test]
    fn test_exact_denomination_match() {
        let s = stock(&[(100, "note", 5)]);
        let result = make_change(100, &s).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].denomination, 100);
        assert_eq!(result[0].count, 1);
    }

    #[test]
    fn test_only_small_coins_available() {
        let s = stock(&[(1, "coin", 50)]);
        let result = make_change(35, &s).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].denomination, 1);
        assert_eq!(result[0].count, 35);
    }

    #[test]
    fn test_empty_stock_returns_none() {
        let s: Vec<CurrencyStock> = vec![];
        assert!(make_change(10, &s).is_none());
    }

    #[test]
    fn test_zero_count_stock_returns_none() {
        let s = stock(&[(10, "coin", 0), (5, "coin", 0), (1, "coin", 0)]);
        assert!(make_change(5, &s).is_none());
    }

    #[test]
    fn test_notes_only_change() {
        let s = stock(&[
            (20, "note", 10),
            (50, "note", 10),
            (100, "note", 10),
        ]);
        let result = make_change(170, &s).unwrap();
        let total: i32 = result.iter().map(|r| r.denomination * r.count).sum();
        assert_eq!(total, 170);
        // 100 + 50 + 20 = 170
        assert_eq!(result[0].denomination, 100);
        assert_eq!(result[1].denomination, 50);
        assert_eq!(result[2].denomination, 20);
    }

    #[test]
    fn test_stock_exhaustion_forces_smaller_denoms() {
        // Only 1 × 100 note available, need 200 change
        // Must use: 100*1 + 50*2 = 200
        let s = stock(&[(100, "note", 1), (50, "note", 5)]);
        let result = make_change(200, &s).unwrap();
        let total: i32 = result.iter().map(|r| r.denomination * r.count).sum();
        assert_eq!(total, 200);
        assert_eq!(result[0].denomination, 100);
        assert_eq!(result[0].count, 1);
        assert_eq!(result[1].denomination, 50);
        assert_eq!(result[1].count, 2);
    }
}
