export interface User {
  id: number;
  username: string;
  nickname: string;
  phone: string;
  avatar: string;
  balance: number;
  address: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  condition: string;
  images: string[];
  sellerId: number;
  status: 'on_sale' | 'sold' | 'off_shelf';
  views: number;
  favorites: number;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: number;
    nickname: string;
    avatar: string;
  };
}

export interface Order {
  id: number;
  orderNo: string;
  productId: number;
  sellerId: number;
  buyerId: number;
  price: number;
  status: OrderStatus;
  address: string;
  phone: string;
  buyerRemark: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  inspectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  returnedAt?: string;
  inspectionResult?: 'passed' | 'failed';
  inspectionRemark?: string;
  product?: {
    id: number;
    title: string;
    price: number;
    images: string[];
    description?: string;
  };
  seller?: {
    id: number;
    nickname: string;
    avatar: string;
  };
  buyer?: {
    id: number;
    nickname: string;
    avatar: string;
  };
  logistics?: Logistics;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'inspecting'
  | 'inspection_passed'
  | 'inspection_failed'
  | 'completed'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export interface Logistics {
  id: number;
  orderId: number;
  trackingNo: string;
  courier: string;
  status: string;
  currentLocation: string;
  trackingHistory: TrackingItem[];
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingItem {
  time: string;
  location: string;
  description: string;
}

export interface ReturnRecord {
  id: number;
  orderId: number;
  reason: string;
  description: string;
  status: ReturnStatus;
  sellerRemark: string;
  returnTrackingNo?: string;
  returnCourier?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  shippedBackAt?: string;
  deliveredBackAt?: string;
  refundedAt?: string;
  order?: {
    id: number;
    orderNo: string;
    price: number;
    status: OrderStatus;
  };
  product?: {
    id: number;
    title: string;
    images: string[];
  };
}

export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'shipped_back'
  | 'delivered_back'
  | 'refunded'
  | 'closed';

export interface Favorite {
  id: number;
  productId: number;
  createdAt: string;
  product?: {
    id: number;
    title: string;
    price: number;
    originalPrice: number;
    images: string[];
    condition: string;
    status: string;
  };
}
