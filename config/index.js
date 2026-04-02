require("dotenv").config();

module.exports = {
  mqtt: {
    url: process.env.MQTT_URL || "mqtt://localhost:1883",
    telemetryTopic: "devicesIn/+/telemetry", 
    publishTopicPrefix: "devicesIn",         
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    topic: process.env.KAFKA_TOPIC || "telemetry",
    consumerGroup: process.env.KAFKA_CONSUMER_GROUP || "influx-writer",
  },
  influx: {
    url:      process.env.INFLUX_URL      || "http://localhost:8086",
    token:    process.env.INFLUX_TOKEN    || "",
    org:      process.env.INFLUX_ORG      || "my-org",
    bucket:   process.env.INFLUX_BUCKET   || "telemetry",
    username: process.env.INFLUX_USERNAME || "admin",
    password: process.env.INFLUX_PASSWORD || "adminpassword",
  },
  simulator: {
    numDevices: parseInt(process.env.NUM_DEVICES || "100", 10), //base 10 = decimal
    staticIntervalMs: parseInt(process.env.PUBLISH_INTERVAL_MS || "10000", 10),
    throughPutRate: parseInt(process.env.THROUGH_PUT_RATE || "5000", 10) // per second 
  },
  consumer: {
    batchSize: parseInt(process.env.KAFKA_BATCH_SIZE || "50000", 10),
    flushMs: parseInt(process.env.KAFKA_FLUSH_MS || "5000", 10), //5 second
  },
  emqx: {
    dashboardPassword: process.env.EMQX_DASHBOARD_PASSWORD || "public",
  },
};
