use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CurrencyStock {
    pub denomination: i32,
    pub currency_type: String,
    pub count: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCurrencyCount {
    pub count: i32,
}
