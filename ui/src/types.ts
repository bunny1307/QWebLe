export interface DBCategory {
  id: string;
  name: string;
  description: string | null;
  image_path: string | null;
  display_order: number;
  active: number;
  created_at?: string;
  updated_at?: string;
}

export interface DBItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
  is_veg: number | boolean;
  available: number | boolean;
  active: number | boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DBUnit {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_path: string | null;
  description: string | null;
  active: number;
  currency_code: string;
  currency_symbol: string;
  created_at?: string;
  updated_at?: string;
}

export interface RestaurantInfo {
  id?: string;
  name: string;
  tagline?: string;
  logo?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  currencyCode?: string;
  currencySymbol: string;
  taxPercentage?: number;
  active?: number | boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface FoodItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  priceMinor?: number;
  image: string;
  available: boolean;
  calories?: string;
  isVeg?: boolean;
  active?: boolean;
  displayOrder?: number;
}

export interface RestaurantData {
  restaurant: RestaurantInfo;
  categories: Category[];
  foods: FoodItem[];
}

export interface CartItem {
  food: FoodItem;
  quantity: number;
}

export type ScreenType =
  | 'CATEGORY_PAGE'
  | 'FOOD_PAGE'
  | 'CHECKOUT_PAGE'
  | 'ORDER_CONFIRMED';

export interface PreparedOrderItem {
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export type KitchenStatus =
  | 'NOT_SENT'
  | 'SENT'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED';

export interface PreparedOrder {
  order_id: string;
  token_number: number;
  token_date: string;
  timestamp: string;
  customer_name: string | null;
  order_status: string;
  kitchen_status: KitchenStatus;
  payment_mode: 'CASH' | 'UPI';
  subtotal: number;
  tax: number;
  total: number;
  items: PreparedOrderItem[];
}
