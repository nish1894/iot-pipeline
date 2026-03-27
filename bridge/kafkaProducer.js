const { Kafka, CompressionTypes } = require("kafkajs");
const config = require("../config");

async function createKafkaProducer() {
  const kafka = new Kafka({
    clientId: "mqtt-bridge",
    brokers: config.kafka.brokers,
  });

  const producer = kafka.producer({
    // Enable idempotency for exactly-once delivery within a session
    idempotent: true,
    // Compress batches to reduce network overhead at high throughput
    compression: CompressionTypes.GZIP,
  });

  await producer.connect();
  console.log("Kafka producer connected");

  async function send(deviceId, payload) {
    try {
      await producer.send({
        topic: config.kafka.topic,
        messages: [
          {
            // Partition by deviceId so messages from one device stay ordered
            key: deviceId,
            value: JSON.stringify(payload),
          },
        ],
      });
    } catch (err) {
      // Log and drop — bridge stays alive; downstream can catch up on reconnect
      console.error(`Kafka send error for ${deviceId}:`, err.message);
    }
  }

  async function disconnect() {
    await producer.disconnect();
  }

  return { send, disconnect };
}

module.exports = { createKafkaProducer };
