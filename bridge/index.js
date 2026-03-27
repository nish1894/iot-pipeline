const { createMqttSubscriber } = require("./mqttSubscriber");
const { createKafkaProducer } = require("./kafkaProducer");

async function main() {
  const { send } = await createKafkaProducer();

  createMqttSubscriber((deviceId, data) => {
    // data already contains the device field — pass through unchanged
    send(deviceId, data);
  });

  process.on("SIGINT", async () => {
    console.log("Shutting down bridge...");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Bridge failed to start:", err);
  process.exit(1);
});
