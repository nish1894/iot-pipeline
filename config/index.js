require("dotenv").config();

module.exports = {
  mqtt: {
    url: process.env.MQTT_URL || "mqtt://localhost:1883",
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    topic: "telemetry",
    consumerGroup: "influx-writer",
  },
  influx: {
    url: process.env.INFLUX_URL || "http://localhost:8086",
    token: process.env.INFLUX_TOKEN || "",
    org: process.env.INFLUX_ORG || "my-org",
    bucket: process.env.INFLUX_BUCKET || "telemetry",
  },
  simulator: {
    numDevices: parseInt(process.env.NUM_DEVICES || "100", 10),
    publishIntervalMs: parseInt(process.env.PUBLISH_INTERVAL_MS || "1000", 10),
    
  },
  consumer: {
    batchSize: parseInt(process.env.KAFKA_BATCH_SIZE || "500", 10),
    flushMs: parseInt(process.env.KAFKA_FLUSH_MS || "5000", 10),
  },
};
