const mqtt = require("mqtt");
const config = require("../config");

const TOPIC = config.mqtt.telemetryTopic;

function createMqttSubscriber(onMessage) {
  const client = mqtt.connect(config.mqtt.url, {
    clientId: `bridge-${process.pid}`,
    reconnectPeriod: 2000, //try reconnection in 2s
    keepalive: 30, //check every 30ss if connection is alive 
  });

  client.on("connect", () => {
    console.log("MQTT connected, subscribing to", TOPIC);
    client.subscribe(TOPIC, { qos: 1 }, (err) => {
      if (err) console.error("Subscribe error:", err.message);
    });
  });

  client.on("message", (topic, payload) => {
    // Extract deviceId from topic: devices/{deviceId}/telemetry
    const deviceId = topic.split("/")[1];
    let data;
    try {
      data = JSON.parse(payload.toString());
    } catch {
      console.warn("Invalid JSON on topic", topic);
      return;
    }
    onMessage(deviceId, data);
  });

  client.on("reconnect", () => console.log("MQTT reconnecting..."));
  client.on("error", (err) => console.error("MQTT error:", err.message));

  return client;
}

module.exports = { createMqttSubscriber };
