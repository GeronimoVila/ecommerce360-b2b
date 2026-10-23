export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  base_price: number;
  purchase_cost: number;
  vat_rate: number;
  profit_margin: number;
  commission_rate: number;
  physical_stock: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  sku: string;
  name: string;
  purchase_cost: number;
  vat_rate: number;
  profit_margin: number;
  physical_stock: number;
  commission_rate: number;
}