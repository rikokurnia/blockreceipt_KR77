import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to connect to database...");
    // Try to fetch one record from a table that should exist
    const count = await prisma.agreement.count();
    console.log(`Connection successful! Found ${count} agreements.`);

    const categories = await prisma.category.findMany({ take: 1 });
    console.log("Categories sample:", categories);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
