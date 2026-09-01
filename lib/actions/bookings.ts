"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { Booking } from "@/models/Booking";
import { Transaction } from "@/models/Transaction";
import { Store } from "@/models/Store";
import { requireAdminSession } from "@/lib/auth/session";
import { isOwnerRole } from "@/lib/auth/roles";
import { daysBetween } from "@/lib/utils";
import { BOOKING_STATUSES, TRANSACTION_TYPES, PAYMENT_METHODS } from "@/lib/constants";

const BookingItemInput = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const BookingInput = z.object({
  storeId: z.string().min(1),
  customerName: z.string().min(2, "Customer name is required."),
  customerPhone: z.string().min(6, "Phone number is required."),
  customerEmail: z.string().email().optional().or(z.literal("")).default(""),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  depositAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().default(""),
  itemsJson: z.string(),
});

export type BookingActionState = { error?: string; success?: boolean };

async function assertStoreAccess(storeId: string) {
  const session = await requireAdminSession();
  if (!isOwnerRole(session.role) && !session.storeIds.includes(storeId)) {
    throw new Error("You don't have access to that store.");
  }
  return session;
}

async function nextBookingNumber(storeId: string) {
  const store = await Store.findById(storeId).select("slug");
  const prefix = (store?.slug ?? "bd").slice(0, 4).toUpperCase();
  const count = await Booking.countDocuments({ store: storeId });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export async function createBooking(
  _prev: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const parsed = BookingInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let items: z.infer<typeof BookingItemInput>[];
  try {
    items = z.array(BookingItemInput).min(1, "Add at least one item.").parse(JSON.parse(parsed.data.itemsJson));
  } catch {
    return { error: "Add at least one valid item." };
  }

  const { storeId, startDate, endDate } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return { error: "End date must be after the start date." };
  const days = daysBetween(start, end);

  let session;
  try {
    session = await assertStoreAccess(storeId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized." };
  }

  await connectToDatabase();

  const bookingItems: {
    product: string;
    name: string;
    size: string;
    quantity: number;
    rentalPricePerDay: number;
  }[] = [];
  let rentalAmount = 0;
  let suggestedDeposit = 0;

  // Reserve stock atomically per line item; roll back on failure.
  const reserved: { productId: string; size: string; quantity: number }[] = [];
  try {
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, store: storeId });
      if (!product) throw new Error("One of the selected items is no longer available.");
      const sizeEntry = product.sizes.find((s) => s.size === item.size);
      if (!sizeEntry) throw new Error(`Size ${item.size} is not available for ${product.name}.`);
      const available = sizeEntry.totalQuantity - sizeEntry.rentedQuantity;
      if (available < item.quantity) {
        throw new Error(`Only ${available} of ${product.name} (${item.size}) left in stock.`);
      }

      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          store: storeId,
          sizes: { $elemMatch: { size: item.size, $expr: { $gte: [{ $subtract: ["$$this.totalQuantity", "$$this.rentedQuantity"] }, item.quantity] } } },
        },
        { $inc: { "sizes.$[el].rentedQuantity": item.quantity } },
        { arrayFilters: [{ "el.size": item.size }], new: true }
      );

      if (!result) {
        throw new Error(`Only a few of ${product.name} (${item.size}) are left — please refresh and try again.`);
      }

      reserved.push({ productId: item.productId, size: item.size, quantity: item.quantity });
      bookingItems.push({
        product: item.productId,
        name: product.name,
        size: item.size,
        quantity: item.quantity,
        rentalPricePerDay: product.rentalPricePerDay,
      });
      rentalAmount += product.rentalPricePerDay * item.quantity * days;
      suggestedDeposit += product.securityDeposit * item.quantity;
    }
  } catch (err) {
    // Roll back any reservations already made for this attempt.
    for (const r of reserved) {
      await Product.updateOne(
        { _id: r.productId, "sizes.size": r.size },
        { $inc: { "sizes.$.rentedQuantity": -r.quantity } }
      );
    }
    return { error: err instanceof Error ? err.message : "Could not reserve items." };
  }

  const depositAmount = parsed.data.depositAmount || suggestedDeposit;
  const totalAmount = rentalAmount + depositAmount;
  const bookingNumber = await nextBookingNumber(storeId);

  await Booking.create({
    bookingNumber,
    store: storeId,
    customer: {
      name: parsed.data.customerName,
      phone: parsed.data.customerPhone,
      email: parsed.data.customerEmail,
    },
    items: bookingItems,
    startDate: start,
    endDate: end,
    days,
    status: "reserved",
    rentalAmount,
    depositAmount,
    totalAmount,
    paidAmount: 0,
    paymentStatus: "unpaid",
    notes: parsed.data.notes,
    createdBy: session.sub,
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/inventory");
  return { success: true };
}

const StatusInput = z.object({ status: z.enum(BOOKING_STATUSES) });

export async function setBookingStatus(bookingId: string, status: string) {
  const parsed = StatusInput.safeParse({ status });
  if (!parsed.success) throw new Error("Invalid status.");

  const session = await requireAdminSession();
  await connectToDatabase();
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (!isOwnerRole(session.role) && !session.storeIds.includes(String(booking.store))) {
    throw new Error("You don't have access to that store.");
  }

  const terminal: readonly string[] = ["returned", "cancelled"];
  if (terminal.includes(booking.status)) {
    throw new Error("This booking is already closed.");
  }

  const releasesStock = parsed.data.status === "returned" || parsed.data.status === "cancelled";
  if (releasesStock) {
    for (const item of booking.items) {
      await Product.updateOne(
        { _id: item.product, "sizes.size": item.size },
        { $inc: { "sizes.$.rentedQuantity": -item.quantity } }
      );
    }
  }

  booking.status = parsed.data.status;
  if (parsed.data.status === "returned") booking.returnedAt = new Date();
  await booking.save();

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/inventory");
}

const PaymentInput = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  method: z.enum(PAYMENT_METHODS).default("cash"),
  note: z.string().optional().default(""),
});

export type PaymentActionState = { error?: string; success?: boolean };

export async function recordBookingPayment(
  bookingId: string,
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const parsed = PaymentInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const session = await requireAdminSession();
  await connectToDatabase();
  const booking = await Booking.findById(bookingId);
  if (!booking) return { error: "Booking not found." };
  if (!isOwnerRole(session.role) && !session.storeIds.includes(String(booking.store))) {
    return { error: "You don't have access to that store." };
  }

  const signedAmount =
    parsed.data.type === "refund" || parsed.data.type === "deposit_refund"
      ? -Math.abs(parsed.data.amount)
      : Math.abs(parsed.data.amount);

  await Transaction.create({
    store: booking.store,
    booking: booking._id,
    type: parsed.data.type,
    amount: signedAmount,
    method: parsed.data.method,
    note: parsed.data.note,
    recordedBy: session.sub,
  });

  if (parsed.data.type === "booking_payment" || parsed.data.type === "deposit") {
    booking.paidAmount = Math.max(0, booking.paidAmount + parsed.data.amount);
  } else if (parsed.data.type === "refund") {
    booking.paidAmount = Math.max(0, booking.paidAmount - parsed.data.amount);
  } else if (parsed.data.type === "deposit_refund") {
    booking.depositReturned = true;
  }

  booking.paymentStatus =
    booking.paidAmount <= 0 ? "unpaid" : booking.paidAmount >= booking.rentalAmount ? "paid" : "partial";
  await booking.save();

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/revenue");
  return { success: true };
}
