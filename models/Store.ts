import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const StoreSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StoreSchema.index({ organization: 1, slug: 1 }, { unique: true });

export type StoreDocument = InferSchemaType<typeof StoreSchema>;

export const Store: Model<StoreDocument> =
  models.Store || model<StoreDocument>("Store", StoreSchema);
