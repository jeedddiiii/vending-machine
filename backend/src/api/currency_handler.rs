use axum::{
    extract::{Path, State},
    routing::{get, put},
    Json, Router,
};

use crate::domain::currency::UpdateCurrencyCount;
use crate::error::AppError;
use crate::service::currency_service;
use crate::DbPool;

pub fn routes() -> Router<DbPool> {
    Router::new()
        .route("/currency", get(list_currency))
        .route("/currency/{denomination}", put(update_currency))
}

async fn list_currency(State(pool): State<DbPool>) -> Result<Json<serde_json::Value>, AppError> {
    let stocks = currency_service::list_currency(&pool).await?;
    Ok(Json(serde_json::json!(stocks)))
}

async fn update_currency(
    State(pool): State<DbPool>,
    Path(denomination): Path<i32>,
    Json(input): Json<UpdateCurrencyCount>,
) -> Result<Json<serde_json::Value>, AppError> {
    let stock = currency_service::update_currency(&pool, denomination, input.count).await?;
    Ok(Json(serde_json::json!(stock)))
}
