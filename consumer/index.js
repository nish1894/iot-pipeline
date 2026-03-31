const { createKafkaConsumer } = require("./kafkaConsumer");
const { writeBatch, close } = require("./influxWriter");

async function main() {

  const consumer = await createKafkaConsumer(async (batch) => {
    await writeBatch(batch);
  });

  const shutdown = async () => {
    console.log("Shutting down consumer...");
    await consumer.disconnect();
    await close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Consumer failed to start:", err);
  process.exit(1);
});
