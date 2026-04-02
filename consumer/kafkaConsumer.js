const { Kafka } = require("kafkajs");
const config = require("../config");

async function createKafkaConsumer(onBatch) {
  const kafka = new Kafka({
    clientId: "influx-writer",
    brokers: config.kafka.brokers,
  });

  const consumer = kafka.consumer({ groupId: config.kafka.consumerGroup });
  await consumer.connect();
  await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });

  console.log(`Kafka consumer connected, group: ${config.kafka.consumerGroup}`);

  // metrics — print every 1 second
  let totalFlushed = 0;
  let lastLogTime = Date.now();

  function metricLogger(count) {
    totalFlushed += count;
  }

  setInterval(() => {
    const timeDiffMs = Date.now() - lastLogTime;
    const rate = (totalFlushed / (timeDiffMs / 1000)).toFixed(2);
    console.log(`[Metrics] Flushed: ${totalFlushed}, Rate: ${rate} msg/s`);
    totalFlushed = 0;
    lastLogTime = Date.now();
  }, 3_000);

  // queue backlog — print every 3 seconds
  setInterval(() => {
    const backlog = queue.length - head;
    console.log(`[Queue] Backlog: ${backlog} batches`);
  }, 3000);

  // queue (index pointer)
  let queue = [];
  let head = 0;

  function enqueue(item) {
    queue.push(item);
  }

  function dequeue() {
    if (head >= queue.length) return null;
    const item = queue[head++];
    if (head > 10_000) {
      queue = queue.slice(head);
      head = 0;
    }
    return item;
  }

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  async function worker() {
    while (true) {
      const batch = dequeue();

      if (!batch) {
        await sleep(10);
        continue;
      }

      const parsed = [];
      for (const m of batch) {
        try {
          parsed.push(JSON.parse(m.toString()));
        } catch {
          console.warn("[Worker] Skipping malformed message");
        }
      }

      if (parsed.length === 0) continue;

      let attempt = 0;
      const MAX_RETRIES = 3;

      while (attempt < MAX_RETRIES) {
        try {
          await onBatch(parsed);
          metricLogger(parsed.length);
          break;
        } catch (err) {
          attempt++;
          console.error(`[Worker] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
          await sleep(1000 * attempt);
        }
      }

      if (attempt === MAX_RETRIES) {
        console.error(`[DLQ] Dropping ${parsed.length} messages after ${MAX_RETRIES} retries`);
      }
    }
  }

  const WORKERS = 3;
  for (let i = 0; i < WORKERS; i++) {
    setTimeout(() => worker(), (10000 / WORKERS) * i);
  }

  await consumer.run({
    eachBatch: async ({ batch }) => {
      const messages = [];
      for (const message of batch.messages) {
        messages.push(message.value);
      }
      if (messages.length > 0) {
        enqueue(messages);
      }
    },
  });

  return consumer;
}

module.exports = { createKafkaConsumer };
