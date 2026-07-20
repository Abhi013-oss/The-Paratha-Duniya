import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Printing current menu items ---');
  const allProds = await prisma.product.findMany({});
  for (const p of allProds) {
    console.log(`- ID: ${p.id} | Name: "${p.name}"`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
