use axum::{
    extract::{Path, State},
    routing::{delete, get, post, put},
    Json, Router,
};

use crate::domain::product::{CreateProduct, UpdateProduct};
use crate::error::AppError;
use crate::service::product_service;
use crate::DbPool;

pub fn routes() -> Router<DbPool> {
    Router::new()
        .route("/products", get(list_products).post(create_product))
        .route(
            "/products/{id}",
            get(get_product).put(update_product).delete(delete_product_handler),
        )
}

async fn list_products(State(pool): State<DbPool>) -> Result<Json<serde_json::Value>, AppError> {
    let products = product_service::list_products(&pool).await?;
    Ok(Json(serde_json::json!(products)))
}

async fn get_product(
    State(pool): State<DbPool>,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, AppError> {
    let product = product_service::get_product(&pool, id).await?;
    Ok(Json(serde_json::json!(product)))
}

async fn create_product(
    State(pool): State<DbPool>,
    Json(input): Json<CreateProduct>,
) -> Result<Json<serde_json::Value>, AppError> {
    let product = product_service::create_product(&pool, input).await?;
    Ok(Json(serde_json::json!(product)))
}

async fn update_product(
    State(pool): State<DbPool>,
    Path(id): Path<i32>,
    Json(input): Json<UpdateProduct>,
) -> Result<Json<serde_json::Value>, AppError> {
    let product = product_service::update_product(&pool, id, input).await?;
    Ok(Json(serde_json::json!(product)))
}

async fn delete_product_handler(
    State(pool): State<DbPool>,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, AppError> {
    product_service::delete_product(&pool, id).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
