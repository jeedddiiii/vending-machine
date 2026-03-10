use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: i32,
    pub product_id: i32,
    pub amount_paid: i32,
    pub change_given: i32,
    pub created_at: DateTime<Utc>,
}
