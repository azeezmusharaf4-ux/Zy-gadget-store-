export type ProductCondition = 
  | 'Brand New' 
  | 'Open Box' 
  | 'Refurbished' 
  | 'Used - Like New' 
  | 'Used - Good';

export type ProductStatus = 
  | 'in_stock' 
  | 'low_stock' 
  | 'out_of_stock' 
  | 'pre_order' 
  | 'archived';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageUrl: string;
  additionalImages?: string[];
  stock: number;
  condition: ProductCondition;
  status: ProductStatus;
  isFeatured?: boolean;
  specifications?: string;
  colors?: string;
  storageCapacity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedStorage?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'contacted' 
  | 'processing' 
  | 'completed' 
  | 'cancelled';

export type ContactMethod = 'whatsapp' | 'phone' | 'email';

export type PaymentMethod = 'bank_transfer' | 'pay_on_delivery' | 'whatsapp_order';

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  color?: string;
  storage?: string;
  imageUrl?: string;
}

export interface OrderInquiry {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  deliveryAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  contactMethod: ContactMethod;
  paymentMethod?: PaymentMethod;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  businessHours: string;
  announcement: string;
  currencySymbol: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  paymentInstructions?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'owner' | 'admin';
  addedAt: string;
}
