import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";
import { TRANSACTION_TYPES, PAYMENT_METHODS } from "@/lib/constants";
export { TRANSACTION_TYPES, PAYMENT_METHODS };

const TransactionSchema = new Schema(
  {
    store: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    // Positive = money in (revenue/deposit collected). Negative = money out (refund/expense).
    amount: { type: Number, required: true },
    method: { type: String, enum: PAYMENT_METHODS, default: "cash" },
    note: { type: String, default: "" },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

TransactionSchema.index({ store: 1, createdAt: -1 });
TransactionSchema.index({ store: 1, type: 1 });

export type TransactionDocument = InferSchemaType<typeof TransactionSchema> & {
  _id: Types.ObjectId;
};

export const Transaction: Model<TransactionDocument> =
  models.Transaction || model<TransactionDocument>("Transaction", TransactionSchema);
