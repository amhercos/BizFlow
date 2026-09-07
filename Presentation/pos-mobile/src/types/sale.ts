export enum PaymentType {
  Cash = 1,
  Credit = 2,
}

export enum UnitType {
  Piece = "Piece",
  Pack = "Pack",
}

export interface CheckoutParams {
  paymentType: PaymentType;
  cashReceived?: number;
  customerCreditId?: string;
  newCustomerName?: string;
  newCustomerContact?: string;
}

export interface ApiError {
  message?: string;
  code?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface AppliedPromotion {
  id: string;
  name: string;
  isActive: boolean;
  promotionType: "Discount" | "Bulk" | "Bundle" | string;
  tiers: {
    quantity: number;
    price: number;
  }[];
  tieUpProductId?: string | null;
  tieUpProductName?: string | null;
  tieUpQuantity?: number | null;
}

export interface BasketItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  unitType: UnitType;
  piecesPerPack: number;
  packPrice: number;
  retailPrice: number;
  promotions?: AppliedPromotion[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryName: string;
  piecesPerPack: number;
  packPrice: number;
  promotions?: AppliedPromotion[];
}

export interface CreateTransactionCommand {
  items: {
    productId: string;
    quantity: number;
    isPack: boolean;
    unitPrice: number;
    subTotal: number;
  }[];
  paymentType: PaymentType;
  totalAmount: number;
  cashReceived: number;
  changeAmount: number;
  customerCreditId?: string;
  newCustomerName?: string;
  newCustomerContact?: string;
}

export interface TransactionResponse {
  transactionId: string;
  message: string;
}
