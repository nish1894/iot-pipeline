const { Kafka, CompressionTypes } = require("kafkajs");
const config = require("../config");

async function createKafkaProducer() {
  const kafka = new Kafka({
    clientId: "mqtt-bridge",
    brokers: config.kafka.brokers,
  });

  const producer = kafka.producer({
    idempotent: true, // no duplicate writes
    compression: CompressionTypes.GZIP //compression for more throughtput
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
      console.error(`Kafka send error for ${deviceId}:`, err.message);
    }
  }

  async function disconnect() {
    await producer.disconnect();
  }

  return { send, disconnect };
}

module.exports = { createKafkaProducer };
