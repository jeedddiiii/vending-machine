use axum::{
    extract::State,
    routing::get,
    Json, Router,
};

use crate::error::AppError;
use crate::repository::transaction_repo;
use crate::DbPool;

pub fn routes() -> Router<DbPool> {
    Router::new().route("/transactions", get(list_transactions))
}

async fn list_transactions(State(pool): State<DbPool>) -> Result<Json<serde_json::Value>, AppError> {
    let txs = transaction_repo::find_all(&pool).await?;
    Ok(Json(serde_json::json!(txs)))
}
