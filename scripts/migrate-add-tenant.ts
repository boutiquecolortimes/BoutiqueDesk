/**
 * One-time migration: creates the Organization for the existing pre-SaaS
 * business ("Color Times") and backfills the `organization` field onto
 * every Store/Product/Category/Booking/Transaction/User document that
 * predates multi-tenancy. Safe to re-run — it's idempotent (skips docs
 * that already have an organization set).
 *
 * Run with: npx tsx --env-file=.env.local scripts/migrate-add-tenant.ts
 */
import mongoose from "mongoose";
import { Organization } from "../models/Organization";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { Booking } from "../models/Booking";
import { Transaction } from "../models/Transaction";
import { User } from "../models/User";

const EXISTING_ORG_NAME = process.env.EXISTING_ORG_NAME || "Color Times";
const EXISTING_ORG_SLUG = process.env.EXISTING_ORG_SLUG || "color-times";

async function main() {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");

  await mongoose.connect(MONGODB_URI);

  let org = await Organization.findOne({ slug: EXISTING_ORG_SLUG });
  if (!org) {
    org = await Organization.create({
      name: EXISTING_ORG_NAME,
      slug: EXISTING_ORG_SLUG,
      plan: "buy",
      planStatus: "active",
      trialEndsAt: null,
    });
    console.log(`Created organization "${org.name}" (${org.slug}), id ${org._id}`);
  } else {
    console.log(`Organization "${org.name}" (${org.slug}) already exists, id ${org._id}`);
  }

  const models = [Store, Category, Product, Booking, Transaction, User] as unknown as mongoose.Model<
    Record<string, unknown>
  >[];
  const results = await Promise.all(
    models.map(async (Model) => {
      const res = await Model.updateMany(
        { organization: { $exists: false } },
        { $set: { organization: org!._id } }
      );
      return [Model.modelName, res.modifiedCount] as const;
    })
  );

  for (const [name, count] of results) {
    console.log(`${name}: backfilled ${count} document(s).`);
  }

  console.log(
    `\nDone. Point your DNS/local dev at "${org.slug}.<root-domain>" to reach this business.`
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
