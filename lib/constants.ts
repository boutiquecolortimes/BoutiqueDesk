/**
 * Shared enum-like constants. Kept dependency-free (no mongoose, no
 * server-only) so client components can safely import them without pulling
 * the Mongoose/MongoDB driver into the browser bundle.
 */
export const PRODUCT_STATUSES = ["active", "maintenance", "retired"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const BOOKING_STATUSES = [
  "reserved",
  "active",
  "returned",
  "cancelled",
  "overdue",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const TRANSACTION_TYPES = [
  "booking_payment",
  "deposit",
  "deposit_refund",
  "refund",
  "expense",
  "adjustment",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
