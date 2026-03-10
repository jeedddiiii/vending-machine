use sqlx::PgPool;
use crate::domain::product::{CreateProduct, Product, UpdateProduct};

pub async fn find_all(pool: &PgPool) -> Result<Vec<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>("SELECT id, name, price, stock_quantity, image_url FROM products ORDER BY id")
        .fetch_all(pool)
        .await
}

pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<Option<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        "SELECT id, name, price, stock_quantity, image_url FROM products WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create(pool: &PgPool, input: &CreateProduct) -> Result<Product, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        "INSERT INTO products (name, price, stock_quantity, image_url) VALUES ($1, $2, $3, $4) RETURNING id, name, price, stock_quantity, image_url",
    )
    .bind(&input.name)
    .bind(input.price)
    .bind(input.stock_quantity)
    .bind(&input.image_url)
    .fetch_one(pool)
    .await
}

pub async fn update(pool: &PgPool, id: i32, input: &UpdateProduct) -> Result<Option<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        r#"UPDATE products SET
            name = COALESCE($1, name),
            price = COALESCE($2, price),
            stock_quantity = COALESCE($3, stock_quantity),
            image_url = COALESCE($4, image_url)
        WHERE id = $5
        RETURNING id, name, price, stock_quantity, image_url"#,
    )
    .bind(&input.name)
    .bind(input.price)
    .bind(input.stock_quantity)
    .bind(&input.image_url)
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM products WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn decrement_stock(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    id: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = $1 AND stock_quantity > 0")
        .bind(id)
        .execute(&mut **tx)
        .await?;
    Ok(())
}
