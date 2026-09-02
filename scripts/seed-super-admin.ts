/**
 * Creates (or updates) BoutiqueDesk's own platform_admin account — not tied
 * to any tenant, used to sign into /platform on the apex/marketing domain
 * to manage the directory of signed-up boutiques. Run with:
 *   npm run seed:super-admin
 * Requires SUPER_ADMIN_NAME / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in
 * .env.local. (For a tenant's first super_admin, use the /get-started
 * signup flow instead, or scripts/migrate-add-tenant.ts for the original
 * pre-SaaS business.)
 */
import mongoose from "mongoose";
import { User } from "../models/User";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const { MONGODB_URI, SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } =
    process.env;

  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");
  if (!SUPER_ADMIN_NAME || !SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    throw new Error(
      "SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD must be set in .env.local"
    );
  }

  await mongoose.connect(MONGODB_URI);

  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);
  const email = SUPER_ADMIN_EMAIL.toLowerCase();

  const user = await User.findOneAndUpdate(
    { email, organization: null },
    {
      $set: {
        name: SUPER_ADMIN_NAME,
        email,
        passwordHash,
        role: "platform_admin",
        organization: null,
        isActive: true,
      },
      $setOnInsert: { storeIds: [] },
    },
    { upsert: true, new: true }
  );

  console.log(`Platform admin ready: ${user.email} (id: ${user._id}) — sign in at the apex domain's /login.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
