use axum::{
    extract::State,
    routing::post,
    Json, Router,
};

use crate::error::AppError;
use crate::service::purchase_service::{self, PurchaseRequest};
use crate::DbPool;

pub fn routes() -> Router<DbPool> {
    Router::new().route("/purchase", post(purchase))
}

async fn purchase(
    State(pool): State<DbPool>,
    Json(req): Json<PurchaseRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = purchase_service::purchase(&pool, req).await?;
    Ok(Json(serde_json::json!(result)))
}
