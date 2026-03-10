use sqlx::PgPool;
use crate::domain::currency::CurrencyStock;
use crate::domain::change::ChangeDenomination;

pub async fn find_all(pool: &PgPool) -> Result<Vec<CurrencyStock>, sqlx::Error> {
    sqlx::query_as::<_, CurrencyStock>(
        "SELECT denomination, currency_type, count FROM currency_stock ORDER BY denomination",
    )
    .fetch_all(pool)
    .await
}

pub async fn update_count(
    pool: &PgPool,
    denomination: i32,
    new_count: i32,
) -> Result<Option<CurrencyStock>, sqlx::Error> {
    sqlx::query_as::<_, CurrencyStock>(
        "UPDATE currency_stock SET count = $1 WHERE denomination = $2 RETURNING denomination, currency_type, count",
    )
    .bind(new_count)
    .bind(denomination)
    .fetch_optional(pool)
    .await
}

/// Within a transaction: add inserted money and subtract change denominations.
pub async fn apply_purchase(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    inserted: &[(i32, i32)], // (denomination, count) the user inserted
    change: &[ChangeDenomination],
) -> Result<(), sqlx::Error> {
    // Add inserted money to stock
    for (denom, cnt) in inserted {
        sqlx::query("UPDATE currency_stock SET count = count + $1 WHERE denomination = $2")
            .bind(cnt)
            .bind(denom)
            .execute(&mut **tx)
            .await?;
    }

    // Subtract change from stock
    for cd in change {
        sqlx::query("UPDATE currency_stock SET count = count - $1 WHERE denomination = $2 AND count >= $1")
            .bind(cd.count)
            .bind(cd.denomination)
            .execute(&mut **tx)
            .await?;
    }

    Ok(())
}
