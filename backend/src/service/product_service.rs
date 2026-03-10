use sqlx::PgPool;
use crate::domain::product::{CreateProduct, Product, UpdateProduct};
use crate::error::AppError;
use crate::repository::product_repo;

pub async fn list_products(pool: &PgPool) -> Result<Vec<Product>, AppError> {
    Ok(product_repo::find_all(pool).await?)
}

pub async fn get_product(pool: &PgPool, id: i32) -> Result<Product, AppError> {
    product_repo::find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Product {id} not found")))
}

pub async fn create_product(pool: &PgPool, input: CreateProduct) -> Result<Product, AppError> {
    if input.price <= 0 {
        return Err(AppError::BadRequest("Price must be positive".into()));
    }
    Ok(product_repo::create(pool, &input).await?)
}

pub async fn update_product(pool: &PgPool, id: i32, input: UpdateProduct) -> Result<Product, AppError> {
    if let Some(price) = input.price {
        if price <= 0 {
            return Err(AppError::BadRequest("Price must be positive".into()));
        }
    }
    product_repo::update(pool, id, &input)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Product {id} not found")))
}

pub async fn delete_product(pool: &PgPool, id: i32) -> Result<(), AppError> {
    if !product_repo::delete(pool, id).await? {
        return Err(AppError::NotFound(format!("Product {id} not found")));
    }
    Ok(())
}
