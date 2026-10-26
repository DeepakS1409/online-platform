export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface ProductImage {
  id: string;
  product_id?: string;
  image_url: string;
  storage_path: string;
  display_order: number;
  is_thumbnail: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category?: Category;
  sku: string;
  selling_price_paise: number;
  purchase_cost_paise: number;
  packaging_cost_paise: number;
  stock_physical: number;
  stock_reserved: number;
  available_stock: number; // calculated: physical - reserved
  low_stock_threshold: number;
  is_active: boolean;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 
  | 'awaiting_confirmation'
  | 'accepted'
  | 'rejected'
  | 'preparing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'refunded';

export type PaymentMethod = 
  | 'upi'
  | 'gpay'
  | 'phonepe'
  | 'bank_transfer'
  | 'cod'
  | 'cash'
  | 'other';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_paise: number;
  quantity: number;
  item_total_paise: number;
  image_url?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status?: string | null;
  to_status: OrderStatus;
  note?: string;
  changed_by?: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  amount_paise: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  shipment_token: string;
  qr_code_data: string;
  label_printed_at?: string;
  shipped_at?: string;
  shipped_by_admin?: string;
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address_snapshot: DeliveryAddress;
  subtotal_paise: number;
  delivery_charge_paise: number;
  grand_total_paise: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  idempotency_key?: string;
  notes?: string;
  reservation_expires_at: string;
  whatsapp_opened_at?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  payments: PaymentRecord[];
  status_history: OrderStatusHistory[];
  shipment?: Shipment;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  change_type: 'initial' | 'stock_in' | 'manual_adjustment' | 'reservation' | 'reservation_release' | 'order_fulfillment' | 'order_cancellation_restock';
  quantity_change: number;
  stock_physical_after: number;
  stock_reserved_after: number;
  reference_order_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface BusinessSettings {
  business_name: string;
  tagline: string;
  whatsapp_number: string;
  contact_phone: string;
  contact_email: string;
  currency_symbol: string;
  default_delivery_charge_paise: number;
  free_delivery_threshold_paise: number;
  min_order_value_paise: number;
  address: string;
  reservation_expiry_hours: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
