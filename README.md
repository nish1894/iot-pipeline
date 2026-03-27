# IoT Telemetry Pipeline

**Devices → MQTT → Bridge → Kafka → Consumer → InfluxDB**

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Kafka running locally on `localhost:9092`

## Setup

### 1. Start MQTT + InfluxDB
```bash
docker-compose up -d
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure `.env`
Copy `.env` and update values, especially `INFLUX_TOKEN` if you change the default.

### 4. Create Kafka topic (if it doesn't exist)
```bash
kafka-topics.sh --create --topic telemetry --bootstrap-server localhost:9092 --partitions 12 --replication-factor 1
```

## Running

Open three terminals:

```bash
# Terminal 1 — Bridge (MQTT → Kafka)
npm run start:bridge

# Terminal 2 — Consumer (Kafka → InfluxDB)
npm run start:consumer

# Terminal 3 — Simulator (after you place device.js)
npm run start:simulator
```

## Key design decisions

| Decision | Reason |
|---|---|
| Partition by `deviceId` | Preserves per-device message ordering in Kafka |
| Consumer batching | Reduces InfluxDB write API calls; configurable via `KAFKA_BATCH_SIZE` / `KAFKA_FLUSH_MS` |
| Bridge logs + drops on Kafka error | Keeps bridge alive; messages are transient sensor data |
| Consumer logs + continues on InfluxDB error | Avoids crashing the consumer; Kafka offsets not committed on error so messages will be re-consumed |

## InfluxDB UI
Visit `http://localhost:8086` — login: `admin` / `adminpassword`

## Scaling
- Increase `NUM_DEVICES` and decrease `PUBLISH_INTERVAL_MS` to simulate higher throughput
- Add Kafka partitions and run multiple consumer instances for horizontal scale
