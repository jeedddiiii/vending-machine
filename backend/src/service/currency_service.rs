use sqlx::PgPool;
use crate::domain::currency::CurrencyStock;
use crate::error::AppError;
use crate::repository::currency_repo;

pub async fn list_currency(pool: &PgPool) -> Result<Vec<CurrencyStock>, AppError> {
    Ok(currency_repo::find_all(pool).await?)
}

pub async fn update_currency(
    pool: &PgPool,
    denomination: i32,
    count: i32,
) -> Result<CurrencyStock, AppError> {
    if count < 0 {
        return Err(AppError::BadRequest("Count cannot be negative".into()));
    }
    currency_repo::update_count(pool, denomination, count)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Denomination {denomination} not found")))
}
