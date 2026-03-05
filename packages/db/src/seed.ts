import { db, accounts, users, accountUsers } from "./index";
import { hash } from "./utils/password";

async function seed() {
  console.log("Seeding database...");

  // Create default account
  const [account] = await db
    .insert(accounts)
    .values({
      name: "Acme Inc",
      locale: "en",
    })
    .returning();

  console.log(`Created account: ${account!.name} (id: ${account!.id})`);

  // Create admin user
  const hashedPassword = await hash("password123");
  const [user] = await db
    .insert(users)
    .values({
      email: "admin@example.com",
      encryptedPassword: hashedPassword,
      name: "Admin User",
      displayName: "Admin",
      type: "super_admin",
    })
    .returning();

  console.log(`Created super admin: ${user!.email} (id: ${user!.id})`);

  // Link user to account as administrator
  await db.insert(accountUsers).values({
    accountId: account!.id,
    userId: user!.id,
    role: "administrator",
  });

  console.log("Linked user to account as administrator");
  console.log("\nSeed complete!");
  console.log("Login with: admin@example.com / password123");
  console.log("User type: super_admin (full platform access)");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
