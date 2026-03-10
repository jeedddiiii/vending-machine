export interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
}

export interface CurrencyStock {
  denomination: number;
  currency_type: "coin" | "note";
  count: number;
}

export interface Transaction {
  id: number;
  product_id: number;
  amount_paid: number;
  change_given: number;
  created_at: string;
}

export interface ChangeDenomination {
  denomination: number;
  count: number;
}

export interface PurchaseRequest {
  product_id: number;
  inserted_money: [number, number][]; // [denomination, count][]
}

export interface PurchaseResponse {
  product_name: string;
  price: number;
  amount_paid: number;
  change_amount: number;
  change_breakdown: ChangeDenomination[];
  transaction_id: number;
}

export interface InsertedMoney {
  [denomination: number]: number; // denomination -> count
}
