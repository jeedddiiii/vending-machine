use sqlx::PgPool;
use crate::domain::transaction::Transaction;

pub async fn find_all(pool: &PgPool) -> Result<Vec<Transaction>, sqlx::Error> {
    sqlx::query_as::<_, Transaction>(
        "SELECT id, product_id, amount_paid, change_given, created_at FROM transactions ORDER BY created_at DESC LIMIT 100",
    )
    .fetch_all(pool)
    .await
}

pub async fn create(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    product_id: i32,
    amount_paid: i32,
    change_given: i32,
) -> Result<Transaction, sqlx::Error> {
    sqlx::query_as::<_, Transaction>(
        "INSERT INTO transactions (product_id, amount_paid, change_given) VALUES ($1, $2, $3) RETURNING id, product_id, amount_paid, change_given, created_at",
    )
    .bind(product_id)
    .bind(amount_paid)
    .bind(change_given)
    .fetch_one(&mut **tx)
    .await
}
