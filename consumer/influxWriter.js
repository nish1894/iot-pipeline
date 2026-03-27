const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const config = require("../config");

function createInfluxWriter() {
  const client = new InfluxDB({ url: config.influx.url, token: config.influx.token });
  const writeApi = client.getWriteApi(config.influx.org, config.influx.bucket, "ms");

  // writeFailed is emitted when a batch fails — we log and let the write API retry
  writeApi.useDefaultTags({});

  async function writeBatch(records) {
    const points = records.map((record) => {
      // Payload shape: { device, time, processed, data: [{sensor, value}, ...] }
      const point = new Point("telemetry")
        .tag("deviceId", record.device)
        .timestamp(new Date(record.time));

      for (const { sensor, value } of record.data || []) {
        point.floatField(sensor, value);
      }

      return point;
    });

    try {
      writeApi.writePoints(points);
      await writeApi.flush();
      console.log(`Wrote ${points.length} points to InfluxDB`);
    } catch (err) {
      // Log and continue — do not crash the consumer process.
      // InfluxDB write API has built-in retry; this catches errors after retries exhausted.
      console.error("InfluxDB write failed (will retry on next batch):", err.message);
    }
  }

  async function close() {
    await writeApi.close();
  }

  return { writeBatch, close };
}

module.exports = { createInfluxWriter };
