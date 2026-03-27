require("dotenv").config();

const config = require("../config");
const { readSensors } = require("./sensor");
const { createMqttClient } = require("../shared/mqttClient");

const { numDevices, publishIntervalMs } = config.simulator;
const MQTT_TOPIC_PREFIX = "devices"; // devices/{deviceId}/telemetry

const deviceIds = Array.from(
  { length: numDevices },
  (_, i) => `device-${String(i).padStart(5, "0")}`,
);

function startSimulator() {
  const { publish, client } = createMqttClient("simulator");

  // Throughput counter
  let msgCount = 0;
  const _publish = client.publish.bind(client);
  client.publish = (...args) => {
    msgCount++;
    return _publish(...args);
  };

  setInterval(() => {
    console.log(
      `Throughput: ~${(msgCount / 10).toFixed(0)} msg/s  (${msgCount} in last 10s, ${numDevices} devices)`,
    );
    msgCount = 0;
  }, 10_000);

  client.on("connect", () => {
    console.log(
      `Spawning ${numDevices} virtual devices at ${publishIntervalMs}ms interval`,
    );

    // Stagger each device's first publish evenly across the interval
    // to avoid a thundering burst at t=0
    const perDeviceDelayMs = publishIntervalMs / numDevices;

    deviceIds.forEach((deviceId, i) => {
      setTimeout(
        () => {
          setInterval(() => {
            publish(
              `${MQTT_TOPIC_PREFIX}/${deviceId}/telemetry`,
              readSensors(deviceId),
            );
          }, publishIntervalMs);
        },
        Math.floor(i * perDeviceDelayMs),
      );
    });
  });
}

startSimulator();
