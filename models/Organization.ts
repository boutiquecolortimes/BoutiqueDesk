import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";

export const ORG_PLANS = ["trial", "rent", "buy"] as const;
export type OrgPlan = (typeof ORG_PLANS)[number];

export const ORG_PLAN_STATUSES = ["active", "expired", "cancelled"] as const;
export type OrgPlanStatus = (typeof ORG_PLAN_STATUSES)[number];

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // The subdomain: <slug>.<root-domain>
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ORG_PLANS, default: "trial" },
    planStatus: { type: String, enum: ORG_PLAN_STATUSES, default: "active" },
    trialEndsAt: { type: Date, default: null },
    // Set only on the "buy" (dedicated) plan.
    customDomain: { type: String, default: "" },
    billingEmail: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type OrganizationDocument = InferSchemaType<typeof OrganizationSchema> & {
  _id: Types.ObjectId;
};

export const Organization: Model<OrganizationDocument> =
  models.Organization || model<OrganizationDocument>("Organization", OrganizationSchema);
