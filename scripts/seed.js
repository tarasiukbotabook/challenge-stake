import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://greedy-badger-196.convex.cloud");

async function seedDatabase() {
  console.log("🌱 Начинаем заполнение базы данных...\n");

  try {
    const result = await client.mutation("seed:seedDatabase", {});
    console.log("✅ Успешно!");
    console.log(result.message);
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    process.exit(1);
  }
}

seedDatabase();
