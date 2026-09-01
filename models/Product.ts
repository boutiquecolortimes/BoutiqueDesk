import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";
import { PRODUCT_STATUSES } from "@/lib/constants";
export { PRODUCT_STATUSES };

const SizeStockSchema = new Schema(
  {
    size: { type: String, required: true },
    totalQuantity: { type: Number, required: true, min: 0, default: 0 },
    rentedQuantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    store: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    sku: { type: String, default: "" },
    description: { type: String, default: "" },
    images: [{ type: String }],
    sizes: { type: [SizeStockSchema], default: [] },
    rentalPricePerDay: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0, default: 0 },
    purchasePrice: { type: Number, min: 0 },
    status: { type: String, enum: PRODUCT_STATUSES, default: "active" },
    isPubliclyVisible: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

ProductSchema.index({ store: 1, slug: 1 }, { unique: true });
ProductSchema.index({ name: "text", description: "text", tags: "text" });

ProductSchema.virtual("totalQuantity").get(function (this: ProductDocument) {
  return this.sizes.reduce((sum, s) => sum + s.totalQuantity, 0);
});

ProductSchema.virtual("availableQuantity").get(function (this: ProductDocument) {
  return this.sizes.reduce((sum, s) => sum + (s.totalQuantity - s.rentedQuantity), 0);
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

export type ProductDocument = InferSchemaType<typeof ProductSchema> & {
  _id: Types.ObjectId;
};

export const Product: Model<ProductDocument> =
  models.Product || model<ProductDocument>("Product", ProductSchema);
