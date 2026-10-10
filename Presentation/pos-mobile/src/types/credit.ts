import { AxiosError } from "axios";

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export type CreditApiError = AxiosError<ApiErrorResponse>;

export interface CustomerCredit {
  id: string;
  customerName: string;
  contactInfo: string;
  creditAmount: number;
}

export interface CreditPurchaseItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface CreditPurchase {
  id: string;
  transactionDate: string;
  totalAmount: number;
  paymentType: string;
  itemCount: number;
  items: CreditPurchaseItem[];
}

export interface PaymentHistory {
  id: string;
  amount: number;
  paymentDate: string;
}

export interface CustomerCreditSummary {
  customerId: string;
  customerName: string;
  contactInfo: string;
  totalDebt: number;
  creditPurchases: CreditPurchase[];
  paymentHistory: PaymentHistory[];
}

export interface CreditStats {
  totalCollected: number;
  totalActiveDebts: number;
  totalOutstanding: number;
}

export interface RecordCreditPaymentCommand {
  customerCreditId: string;
  amountPaid: number;
}

export interface UpdateCustomerCreditCommand {
  id: string;
  customerName: string;
  contactInfo: string;
}