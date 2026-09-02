import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";
import { ROLES } from "@/lib/auth/roles";

const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    // Null only for platform_admin (BoutiqueDesk's own team, not tied to a tenant).
    organization: { type: Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, default: "customer" },
    // Stores this user is scoped to. Empty for developer/super_admin (all stores).
    storeIds: [{ type: Schema.Types.ObjectId, ref: "Store" }],
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    // Customer-only fields
    addresses: [AddressSchema],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

UserSchema.index({ organization: 1, email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };

export const User: Model<UserDocument> =
  models.User || model<UserDocument>("User", UserSchema);
