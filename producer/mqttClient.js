// shared/mqttClient.js

const mqtt = require("mqtt");
const config = require("../config");

function createMqttClient(clientName) {
  const client = mqtt.connect(config.mqtt.url, {
    clientId: `${clientName}-${process.pid}`,
    reconnectPeriod: 2000,
    protocolVersion: 5, // latest version for larger in-flight window for high throughput, what version do we use ? 
    clean: true, //fresh connection everytime , no state stored 
  });

  //alerts
  client.on("connect", () => console.log(`[${clientName}] MQTT connected to ${config.mqtt.url}`), );
  client.on("reconnect", () => console.warn(`[${clientName}] MQTT reconnecting...`));
  client.on("error", (err) => console.error(`[${clientName}] MQTT error:`, err.message), );

  // topic string → handler(message, topic)
  const handlers = {};

  // message is event 
  client.on("message", (topic, message) => { if (handlers[topic]) handlers[topic](message, topic);});

  //qos 0 or 1 ? 
  function publish(topic, payload) { 
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err)
        console.error(`[${clientName}] publish failed on "${topic}":`, err.message);
    });
  }

  function subscribe(topic, handler) {
    handlers[topic] = handler;
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err)
        console.error(
          `[${clientName}] subscribe failed on "${topic}":`,
          err.message,
        );
      else console.log(`[${clientName}] subscribed to "${topic}"`);
    });
  }

  return { publish, subscribe, client };
}

module.exports = { createMqttClient };
