const config = require("../config");
const { readSensors } = require("./sensor");
const { createMqttClient } = require("./mqttClient");

// Configuration 
const { numDevices, staticIntervalMs, throughPutRate } = config.simulator;
const { publishTopicPrefix } = config.mqtt;

// Burst logic calculation
const msgsPerDevicePerBurst = Math.max(
  1,
  Math.floor(throughPutRate / ((staticIntervalMs / 1000) * numDevices))
);

// IDs: device-00001, device-00002, etc.
const deviceIds = Array.from(
  { length: numDevices },
  (_, i) => `device-${String(i).padStart(5, "0")}`
);

function startSimulator() {
  const { publish, client } = createMqttClient("simulator");

  // publish with tracking message count
  let msgCount = 0;
  function trackedPublish(topic, payload) {
    msgCount++;
    publish(topic, payload);
  }

  // Report msg/s to console every 10s
  setInterval(() => {
    const avgRate = (msgCount / 10).toFixed(1);
    console.log(
      `[Stats] Target: ${throughPutRate} total msg/burst | Actual: ~${avgRate} msg/s average (${numDevices} devices)`
    );
    msgCount = 0;
  }, 10000);

  // --- Main Loop (Burst Pattern) ---
  client.on("connect", () => {
    console.log(`[Simulator] Starting Burst Mode for ${numDevices} devices.`);
    console.log(`[Simulator] Targeted messages per cycle: ${throughPutRate}.`);
    console.log(
      `[Simulator] Each device will send ${msgsPerDevicePerBurst} messages per burst.`
    );

    // Evenly stagger the start of each device's burst cycle 
    const staggeredDelayMs = staticIntervalMs / numDevices;

    deviceIds.forEach((deviceId, i) => {
      const initialDelay = Math.floor(i * staggeredDelayMs);

      setTimeout(() => {
        const topic = `${publishTopicPrefix}/${deviceId}/telemetry`;

        // Execution of a single burst
        const executeBurst = () => {
          for (let j = 0; j < msgsPerDevicePerBurst; j++) {
            trackedPublish(topic, readSensors(deviceId));
          }
        };

        // First burst
        executeBurst();

        // Repeating bursts
        setInterval(executeBurst, staticIntervalMs);
      }, initialDelay);
    });
  });
}

startSimulator();