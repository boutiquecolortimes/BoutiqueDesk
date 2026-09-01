/**
 * Creates (or updates) the first super_admin account so there's a way to log
 * into /admin. Run with: npm run seed:super-admin
 * Requires SUPER_ADMIN_NAME / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in .env.local.
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
    { email },
    {
      $set: {
        name: SUPER_ADMIN_NAME,
        email,
        passwordHash,
        role: "super_admin",
        isActive: true,
      },
      $setOnInsert: { storeIds: [] },
    },
    { upsert: true, new: true }
  );

  console.log(`Super admin ready: ${user.email} (id: ${user._id})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
