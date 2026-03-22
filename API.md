# Cycling Manager Engine – API Reference

Base URL: `http://localhost:3000`

---

## Endpoints

| Method | Path                          | Description                            |
| ------ | ----------------------------- | -------------------------------------- |
| `GET`  | `/race`                       | List all races (summary)               |
| `POST` | `/race/start`                 | Create a new race                      |
| `GET`  | `/race/:id`                   | Get full race state                    |
| `POST` | `/race/:id/simulate`          | Run the simulation                     |
| `GET`  | `/race/:id/snapshots`         | Get all simulation snapshots           |
| `GET`  | `/race/:id/snapshots/at?km=N` | Get snapshot at a specific km          |
| `GET`  | `/race/:id/leaderboard`       | Final leaderboard (sorted by position) |

---

## 1. `GET /race` – List all races

Returns a summary array of all races created in the current session.

**Response**

```json
[
  {
    "id": "e222978e-edbb-4191-81e5-56f196260ad7",
    "name": "Tour de Test",
    "totalDistance": 150,
    "status": "FINISHED",
    "createdAt": "2026-03-21T17:54:39.000Z",
    "finishedAt": "2026-03-21T17:54:39.012Z"
  }
]
```

---

## 2. `POST /race/start` – Create a race

Defines the race geometry, teams, and cyclists. Returns the new race object with `status: "PENDING"`.

**Request body**

```json
{
  "name": "Tour de France Stage 8",
  "totalDistance": 150,
  "seed": 42,
  "segments": [
    { "startKm": 0, "endKm": 60, "type": "flat", "gradient": 0 },
    { "startKm": 60, "endKm": 90, "type": "climb", "gradient": 6 },
    { "startKm": 90, "endKm": 120, "type": "descent", "gradient": -4 },
    {
      "startKm": 120,
      "endKm": 150,
      "type": "flat",
      "gradient": 0,
      "wind": { "direction": "head", "strength": 0.6 }
    }
  ],
  "teams": [
    {
      "id": "team-gc",
      "name": "GC Eagles",
      "leaderId": "rider-1",
      "domestiqueIds": ["rider-2"],
      "strategy": "GENERAL_CLASSIFICATION"
    },
    {
      "id": "team-sprint",
      "name": "Sprint Force",
      "leaderId": "rider-3",
      "domestiqueIds": ["rider-4"],
      "strategy": "SPRINT_STAGE"
    }
  ],
  "cyclists": [
    {
      "id": "rider-1",
      "name": "Marco Alpe",
      "teamId": "team-gc",
      "stats": {
        "stamina": 85,
        "performance": 88,
        "climbing": 90,
        "sprint": 60,
        "vigilance": 80,
        "resistance": 75,
        "recovery": 70
      }
    },
    {
      "id": "rider-2",
      "name": "Luca Forte",
      "teamId": "team-gc",
      "stats": {
        "stamina": 78,
        "performance": 75,
        "climbing": 70,
        "sprint": 55,
        "vigilance": 65,
        "resistance": 70,
        "recovery": 75
      }
    },
    {
      "id": "rider-3",
      "name": "Felix Blitz",
      "teamId": "team-sprint",
      "stats": {
        "stamina": 75,
        "performance": 82,
        "climbing": 50,
        "sprint": 95,
        "vigilance": 85,
        "resistance": 72,
        "recovery": 65
      }
    },
    {
      "id": "rider-4",
      "name": "Jan Helfer",
      "teamId": "team-sprint",
      "stats": {
        "stamina": 80,
        "performance": 78,
        "climbing": 60,
        "sprint": 70,
        "vigilance": 70,
        "resistance": 75,
        "recovery": 72
      }
    }
  ]
}
```

**Stat guide (all 0–100)**

| Stat          | Effect                                 |
| ------------- | -------------------------------------- |
| `stamina`     | Starting energy pool                   |
| `performance` | General power output                   |
| `climbing`    | Speed efficiency on climbs             |
| `sprint`      | Sprint boost in final 3 km             |
| `vigilance`   | Positioning awareness, attack reaction |
| `resistance`  | Crash/fatigue resilience               |
| `recovery`    | Slows fatigue accumulation             |

**Team strategies**

| Strategy                 | Behaviour                                         |
| ------------------------ | ------------------------------------------------- |
| `GENERAL_CLASSIFICATION` | Leader conserves energy; domestiques control pace |
| `SPRINT_STAGE`           | Controls peloton; sprinter saved for the finish   |
| `BREAKAWAY`              | Attacks early and often                           |
| `BALANCED`               | No special bias                                   |

**Response** – `201 Created`

```json
{
  "id": "e222978e-edbb-4191-81e5-56f196260ad7",
  "name": "Tour de France Stage 8",
  "status": "PENDING",
  "totalDistance": 150,
  "seed": 42,
  "createdAt": "2026-03-21T17:54:39.000Z",
  "segments": [...],
  "teams": [...],
  "cyclists": [...],
  "snapshots": []
}
```

---

## 3. `GET /race/:id` – Get race state

Returns the full race object including current cyclist states and all snapshots.

**curl example**

```bash
curl http://localhost:3000/race/e222978e-edbb-4191-81e5-56f196260ad7
```

---

## 4. `POST /race/:id/simulate` – Run simulation

Runs the engine loop and produces snapshots. Call once per race (idempotent error if already finished).

**Request body** (optional – override seed)

```json
{ "seed": 1234 }
```

**Response** – `200 OK` – full race object with `status: "FINISHED"` and all snapshots populated.

**curl example**

```bash
curl -s -X POST http://localhost:3000/race/RACE_ID/simulate \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Snapshot structure**

```json
{
  "km": 60,
  "cyclists": [
    {
      "id": "rider-1",
      "name": "Marco Alpe",
      "teamId": "team-gc",
      "position": 60.0,
      "speed": 28.45,
      "energy": 77.3,
      "intent": "PROTECT_LEADER",
      "groupId": "g1",
      "isDropped": false
    }
  ]
}
```

**Snapshot schedule** (for a 150 km race)

| Range      | Step        | # snapshots |
| ---------- | ----------- | ----------- |
| 0–100 km   | every 10 km | 10          |
| 100–140 km | every 5 km  | 8           |
| 140–150 km | every 1 km  | 10          |

**Intent values**

| Intent           | Meaning                      |
| ---------------- | ---------------------------- |
| `FOLLOW_PELOTON` | Sitting in the bunch         |
| `SAVE_ENERGY`    | Conserving (low energy)      |
| `CHASE`          | Chasing a breakaway          |
| `ATTACK`         | Attacking off the front      |
| `BREAKAWAY`      | In an established breakaway  |
| `PROTECT_LEADER` | Domestique shielding leader  |
| `SPRINT_PREP`    | Building for sprint (<10 km) |
| `SPRINT`         | Full sprint (<3 km)          |

---

## 5. `GET /race/:id/snapshots` – All snapshots

Returns the full snapshot array.

**curl example**

```bash
curl http://localhost:3000/race/RACE_ID/snapshots
```

---

## 6. `GET /race/:id/snapshots/at?km=N` – Snapshot at km

Returns a single snapshot at the exact km mark.

Valid km values are those produced by the step schedule (e.g., 10, 20, …, 100, 105, …, 140, 141, …, 150).

**curl example**

```bash
curl "http://localhost:3000/race/RACE_ID/snapshots/at?km=60"
```

**Response**

```json
{
  "km": 60,
  "cyclists": [...]
}
```

---

## 7. `GET /race/:id/leaderboard` – Final leaderboard

Returns cyclists sorted by final position (leader first). Only available after simulation.

**curl example**

```bash
curl http://localhost:3000/race/RACE_ID/leaderboard
```

**Response**

```json
[
  {
    "rank": 1,
    "id": "rider-1",
    "name": "Marco Alpe",
    "teamId": "team-gc",
    "position": 150,
    "speed": 34.76,
    "energy": 79.0,
    "intent": "SPRINT",
    "groupId": "g1",
    "isDropped": false
  },
  {
    "rank": 2,
    "id": "rider-3",
    "name": "Felix Blitz",
    "teamId": "team-sprint",
    "position": 150,
    "speed": 23.98,
    "energy": 59.8,
    "intent": "SPRINT",
    "groupId": "g2",
    "isDropped": false
  }
]
```

---

## Full workflow example (curl)

```bash
# 1. Create race
RACE=$(curl -s -X POST http://localhost:3000/race/start \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "name": "Alpine Classic",
  "totalDistance": 200,
  "seed": 99,
  "segments": [
    { "startKm": 0,   "endKm": 80,  "type": "flat",    "gradient": 0 },
    { "startKm": 80,  "endKm": 120, "type": "climb",   "gradient": 8 },
    { "startKm": 120, "endKm": 160, "type": "descent", "gradient": -5 },
    { "startKm": 160, "endKm": 200, "type": "flat",    "gradient": 0 }
  ],
  "teams": [
    {
      "id": "t1", "name": "Climbers United",
      "leaderId": "c1", "domestiqueIds": ["c2", "c3"],
      "strategy": "GENERAL_CLASSIFICATION"
    },
    {
      "id": "t2", "name": "Sprinters Inc",
      "leaderId": "c4", "domestiqueIds": ["c5", "c6"],
      "strategy": "SPRINT_STAGE"
    }
  ],
  "cyclists": [
    { "id": "c1", "name": "Ivan Krauss",   "teamId": "t1", "stats": { "stamina": 88, "performance": 86, "climbing": 94, "sprint": 55, "vigilance": 82, "resistance": 78, "recovery": 74 } },
    { "id": "c2", "name": "Andre Bauer",   "teamId": "t1", "stats": { "stamina": 80, "performance": 76, "climbing": 72, "sprint": 50, "vigilance": 68, "resistance": 72, "recovery": 78 } },
    { "id": "c3", "name": "Karl Steiner",  "teamId": "t1", "stats": { "stamina": 77, "performance": 73, "climbing": 68, "sprint": 48, "vigilance": 64, "resistance": 70, "recovery": 76 } },
    { "id": "c4", "name": "Tom Swift",     "teamId": "t2", "stats": { "stamina": 74, "performance": 84, "climbing": 48, "sprint": 97, "vigilance": 88, "resistance": 70, "recovery": 62 } },
    { "id": "c5", "name": "Rick Muller",   "teamId": "t2", "stats": { "stamina": 82, "performance": 80, "climbing": 58, "sprint": 72, "vigilance": 72, "resistance": 76, "recovery": 73 } },
    { "id": "c6", "name": "Hans Voigt",    "teamId": "t2", "stats": { "stamina": 79, "performance": 77, "climbing": 62, "sprint": 68, "vigilance": 70, "resistance": 74, "recovery": 71 } }
  ]
}
EOF
)

RACE_ID=$(echo $RACE | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
echo "Created race: $RACE_ID"

# 2. Run simulation
curl -s -X POST http://localhost:3000/race/$RACE_ID/simulate \
  -H "Content-Type: application/json" -d '{}' | python3 -c \
  'import json,sys; r=json.load(sys.stdin); print("Snapshots:", len(r["snapshots"]))'

# 3. Check snapshot at climb peak
curl -s "http://localhost:3000/race/$RACE_ID/snapshots/at?km=120"

# 4. Final leaderboard
curl -s http://localhost:3000/race/$RACE_ID/leaderboard
```

---

## Error responses

| Status          | Situation                                             |
| --------------- | ----------------------------------------------------- |
| `404 Not Found` | Unknown race id or snapshot km                        |
| `409 Conflict`  | Simulating a race that is already RUNNING or FINISHED |

---

## Running the server

```bash
npm install
npm run start:dev     # development (watch mode, port 3000)
npm run build         # compile TypeScript
npm run start:prod    # production (compiled dist/)
```
