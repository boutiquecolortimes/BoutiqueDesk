import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";
import { BOOKING_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
export { BOOKING_STATUSES, PAYMENT_STATUSES };

const BookingItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot at booking time
    size: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    rentalPricePerDay: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BookingSchema = new Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    store: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    customer: {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: "" },
    },
    items: { type: [BookingItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    status: { type: String, enum: BOOKING_STATUSES, default: "reserved" },
    rentalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0, default: 0 },
    depositReturned: { type: Boolean, default: false },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
    notes: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    returnedAt: { type: Date },
  },
  { timestamps: true }
);

BookingSchema.index({ store: 1, startDate: 1, endDate: 1 });

export type BookingDocument = InferSchemaType<typeof BookingSchema> & {
  _id: Types.ObjectId;
};

export const Booking: Model<BookingDocument> =
  models.Booking || model<BookingDocument>("Booking", BookingSchema);
