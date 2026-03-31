const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const config = require('../config');

const writeApi = new InfluxDB({ url: config.influx.url, token: config.influx.token })
  .getWriteApi(config.influx.org, config.influx.bucket, 'ms');

async function writeBatch(records) {
  const points = records.flatMap(({ device, time, processed, data }) =>
    (data || []).map(({ sensor, value }) =>
      new Point(device)
        .tag('sensor', sensor)
        .tag('processed', String(processed))
        .floatField('value', value)
        .timestamp(new Date(time)),
    ),
  );

  try {
    writeApi.writePoints(points);
    await writeApi.flush();
  } catch (err) {
    console.error(`[InfluxDB] Write error:`, err.message);
  }
}

async function close() {
  await writeApi.close();
}

module.exports = { writeBatch, close };
