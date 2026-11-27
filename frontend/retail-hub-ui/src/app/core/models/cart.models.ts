export interface CartItemInput {
  productId: number;
  productName: string;
  unitPrice: number;
  packagingDetails?: string;
  imageUrl?: string | null;
  maxStock?: number;
}

export interface CartItem extends CartItemInput {
  quantity: number;
  subtotal: number;
}
