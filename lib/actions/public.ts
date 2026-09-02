"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Booking } from "@/models/Booking";
import { Store } from "@/models/Store";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/tokens";
import { getSession } from "@/lib/auth/session";
import { getCurrentOrg } from "@/lib/tenant";
import { daysBetween } from "@/lib/utils";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  authCookieOptions,
} from "@/lib/auth/cookies";
import { cookies } from "next/headers";

// ---------- Registration ----------

const RegisterInput = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(6, "Phone number is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type RegisterActionState = { error?: string; success?: boolean };

export async function registerCustomer(
  _prev: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const parsed = RegisterInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const org = await getCurrentOrg();
  if (!org) {
    return { error: "This boutique isn't available right now." };
  }

  await connectToDatabase();
  const email = parsed.data.email.toLowerCase();
  if (await User.exists({ email, organization: org._id })) {
    return { error: "An account with this email already exists." };
  }

  const user = await User.create({
    organization: org._id,
    name: parsed.data.name,
    email,
    phone: parsed.data.phone,
    role: "customer",
    passwordHash: await hashPassword(parsed.data.password),
  });

  const accessToken = await signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name,
    storeIds: [],
    orgId: String(org._id),
  });
  const refreshToken = await signRefreshToken({ sub: user._id.toString(), tokenVersion: 0 });

  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...authCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...authCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });

  return { success: true };
}

// ---------- Wishlist ----------

export async function toggleWishlist(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("Please sign in to save items.");

  await connectToDatabase();
  const user = await User.findById(session.sub);
  if (!user) throw new Error("Account not found.");

  const has = user.wishlist.some((id) => String(id) === productId);
  if (has) {
    user.wishlist = user.wishlist.filter((id) => String(id) !== productId);
  } else {
    const product = await Product.exists({ _id: productId, organization: session.orgId });
    if (!product) throw new Error("That item isn't available.");
    user.wishlist.push(productId as unknown as never);
  }
  await user.save();

  revalidatePath("/wishlist");
  revalidatePath("/collections");
  return { wishlisted: !has };
}

// ---------- Booking requests (storefront) ----------

const BookingRequestItem = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const BookingRequestInput = z.object({
  storeId: z.string().min(1),
  customerName: z.string().min(2, "Name is required."),
  customerPhone: z.string().min(6, "Phone number is required."),
  customerEmail: z.string().email().optional().or(z.literal("")).default(""),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  itemsJson: z.string(),
});

export type BookingRequestState = { error?: string; success?: boolean; bookingNumber?: string };

export async function requestBooking(
  _prev: BookingRequestState,
  formData: FormData
): Promise<BookingRequestState> {
  const parsed = BookingRequestInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let items: z.infer<typeof BookingRequestItem>[];
  try {
    items = z.array(BookingRequestItem).min(1).parse(JSON.parse(parsed.data.itemsJson));
  } catch {
    return { error: "Select at least one item." };
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (end < start) return { error: "End date must be after the start date." };
  const days = daysBetween(start, end);

  const org = await getCurrentOrg();
  if (!org) return { error: "This boutique isn't available right now." };

  await connectToDatabase();
  const session = await getSession();

  const store = await Store.findOne({ _id: parsed.data.storeId, organization: org._id }).select("slug");
  if (!store) return { error: "That store isn't available." };

  const bookingItems: {
    product: string;
    name: string;
    size: string;
    quantity: number;
    rentalPricePerDay: number;
  }[] = [];
  let rentalAmount = 0;
  let depositAmount = 0;
  const reserved: { productId: string; size: string; quantity: number }[] = [];

  try {
    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        store: parsed.data.storeId,
        status: "active",
        isPubliclyVisible: true,
      });
      if (!product) throw new Error("One of the selected items is no longer available.");
      const sizeEntry = product.sizes.find((s) => s.size === item.size);
      if (!sizeEntry) throw new Error(`Size ${item.size} is not available for ${product.name}.`);

      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          store: parsed.data.storeId,
          sizes: {
            $elemMatch: {
              size: item.size,
              $expr: { $gte: [{ $subtract: ["$$this.totalQuantity", "$$this.rentedQuantity"] }, item.quantity] },
            },
          },
        },
        { $inc: { "sizes.$[el].rentedQuantity": item.quantity } },
        { arrayFilters: [{ "el.size": item.size }], new: true }
      );
      if (!result) {
        throw new Error(`Only a few of ${product.name} (${item.size}) are left — please adjust the quantity.`);
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
      depositAmount += product.securityDeposit * item.quantity;
    }
  } catch (err) {
    for (const r of reserved) {
      await Product.updateOne(
        { _id: r.productId, "sizes.size": r.size },
        { $inc: { "sizes.$.rentedQuantity": -r.quantity } }
      );
    }
    return { error: err instanceof Error ? err.message : "Could not reserve items." };
  }

  const prefix = (store.slug ?? "bd").slice(0, 4).toUpperCase();
  const count = await Booking.countDocuments({ store: parsed.data.storeId });
  const bookingNumber = `${prefix}-${String(count + 1).padStart(5, "0")}`;

  await Booking.create({
    bookingNumber,
    organization: org._id,
    store: parsed.data.storeId,
    customer: {
      user: session?.sub,
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
    totalAmount: rentalAmount + depositAmount,
    paidAmount: 0,
    paymentStatus: "unpaid",
    notes: "Requested from the storefront — pending store confirmation.",
  });

  return { success: true, bookingNumber };
}

// ---------- Order tracking ----------

const TrackInput = z.object({
  bookingNumber: z.string().min(1),
  phone: z.string().min(4),
});

export async function trackOrder(formData: FormData) {
  const parsed = TrackInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return null;

  const org = await getCurrentOrg();
  if (!org) return null;

  await connectToDatabase();
  const booking = await Booking.findOne({
    organization: org._id,
    bookingNumber: parsed.data.bookingNumber.trim().toUpperCase(),
    "customer.phone": parsed.data.phone.trim(),
  }).populate("store", "name");

  return booking
    ? {
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        store: (booking.store as unknown as { name?: string })?.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount,
        items: booking.items,
      }
    : null;
}
