const { Kafka } = require("kafkajs");
const config = require("../config");

async function createKafkaConsumer(onBatch) {
  const kafka = new Kafka({
    clientId: "influx-writer",
    brokers: config.kafka.brokers,
  });

  const consumer = kafka.consumer({ groupId: config.kafka.consumerGroup });
  await consumer.connect();
  await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false }); // read latest messages only 

  console.log(`Kafka consumer connected, group: ${config.kafka.consumerGroup}`);

  // Accumulate messages and flush either when batch is full or timer fires
  let buffer = [];
  let flushTimer = null;

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(async () => {
      flushTimer = null;
      if (buffer.length > 0) {
        const toFlush = buffer.splice(0, buffer.length);
        await onBatch(toFlush);
      }
    }, config.consumer.flushMs);
  }

  await consumer.run({
    eachMessage: async ({ message }) => {
      let payload;
      try {
        payload = JSON.parse(message.value.toString());
      } catch {
        console.warn("Skipping malformed message");
        return;
      }

      buffer.push(payload);

      if (buffer.length >= config.consumer.batchSize) {
        clearTimeout(flushTimer);
        flushTimer = null;
        const toFlush = buffer.splice(0, buffer.length);
        await onBatch(toFlush);
      } else {
        scheduleFlush();
      }
    },
  });

  return consumer;
}

module.exports = { createKafkaConsumer };
