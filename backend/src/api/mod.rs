pub mod product_handler;
pub mod currency_handler;
pub mod purchase_handler;
pub mod transaction_handler;

use axum::Router;
use crate::DbPool;

pub fn router() -> Router<DbPool> {
    Router::new()
        .merge(product_handler::routes())
        .merge(currency_handler::routes())
        .merge(purchase_handler::routes())
        .merge(transaction_handler::routes())
}
