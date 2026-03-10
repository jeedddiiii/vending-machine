use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: i32,
    pub name: String,
    pub price: i32,
    pub stock_quantity: i32,
    pub image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProduct {
    pub name: String,
    pub price: i32,
    pub stock_quantity: i32,
    pub image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProduct {
    pub name: Option<String>,
    pub price: Option<i32>,
    pub stock_quantity: Option<i32>,
    pub image_url: Option<String>,
}
