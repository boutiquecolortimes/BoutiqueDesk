import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type CategoryDocument = InferSchemaType<typeof CategorySchema>;

export const Category: Model<CategoryDocument> =
  models.Category || model<CategoryDocument>("Category", CategorySchema);
