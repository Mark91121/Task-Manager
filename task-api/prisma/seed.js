const prisma = require("../src/prismaClient");

const DEFAULT_CATEGORIES = [
  { name: "Work", color: "#5b5bd6" },
  { name: "Home", color: "#2f9e68" },
  { name: "Personal", color: "#d6914a" },
];

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log("Seeded default categories: Work, Home, Personal");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
