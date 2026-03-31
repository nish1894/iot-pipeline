
// mock sensors


const SENSORS = {
  temperature: () => parseFloat((18 + Math.random() * 14).toFixed(2)),  // °C  18–32
  humidity:    () => parseFloat((35 + Math.random() * 40).toFixed(2)),  // %   35–75
  pressure:    () => parseFloat((995 + Math.random() * 30).toFixed(2)), // hPa 995–1025
  vibration:   () => parseFloat((Math.random() * 5).toFixed(3)),        // g   0–5
};

function readSensors(deviceId) {
  return {
    device:    deviceId,
    time:      Date.now(),
    processed: false,
    data: Object.entries(SENSORS).map(([sensor, read]) => ({ sensor, value: read() })),
  };
}

module.exports = { readSensors };


