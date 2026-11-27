export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'OutForDelivery',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: readonly CreateOrderItemRequest[];
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  packagingDetails: string;
  lineTotal: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  userId: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: readonly OrderItemResponse[];
}

export interface OrderQuery {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  search?: string;
}
