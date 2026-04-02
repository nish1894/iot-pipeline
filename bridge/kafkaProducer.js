const { Kafka, CompressionTypes } = require("kafkajs");
const config = require("../config");

// Producer batch configuration
const MAX_BUFFER_BYTES = config.producer.maxBufferBytes;
const LINGER_MS = config.producer.lingerMs;

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

  // Batch send — accumulate messages then flush in one send
  let buffer = [];
  let lingerTimer = null;

  //just the flush
  async function flush() {
    if (buffer.length === 0) return;
    const toSend = buffer.splice(0, buffer.length);
    lingerTimer = null;

    try {
      await producer.send({
        topic: config.kafka.topic,
        messages: toSend, // one network call with all buffered messages
      });
    } catch (err) {
      console.error(`Kafka batch send error:`, err.message);
    }
  }

  // track buffer size in bytes
  let bufferBytes = 0;

  async function send(deviceId, payload) {
    const value = JSON.stringify(payload);
    
    buffer.push({
      key: deviceId,
      value: value,
    });

    bufferBytes += Buffer.byteLength(value);

    // flush immediately if buffer hits 10MB
    if (bufferBytes >= MAX_BUFFER_BYTES) {
      clearTimeout(lingerTimer);
      lingerTimer = null;
      bufferBytes = 0;
      await flush();
      return;
    }

    // fallback timer — flush after 1000ms even if 10MB not reached
    if (!lingerTimer) {
      lingerTimer = setTimeout(() => {
        bufferBytes = 0;
        flush();
      }, LINGER_MS);
    }
  }


  async function disconnect() {
    await producer.disconnect();
  }

  return { send, disconnect };
}

module.exports = { createKafkaProducer };
