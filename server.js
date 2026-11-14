const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;
const ARENA = 48;
const players = new Map();
const foods = [];

function rand(min, max) { return Math.random() * (max - min) + min; }
function makeFood() {
  return { id: crypto.randomUUID(), x: rand(-ARENA/2, ARENA/2), z: rand(-ARENA/2, ARENA/2), value: 1 };
}
for (let i = 0; i < 90; i++) foods.push(makeFood());

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function snapshot() {
  return {
    type: "state",
    players: [...players.values()].map(p => ({
      id: p.id, name: p.name, x: p.x, z: p.z, score: p.score, color: p.color
    })),
    foods
  };
}

wss.on("connection", ws => {
  const id = crypto.randomUUID();
  const colors = ["#42d6ff", "#ff6b8a", "#a78bfa", "#ffd166", "#72e6a5", "#ff9f43"];
  const player = {
    id, name: "Oyuncu", x: rand(-8, 8), z: rand(-8, 8),
    score: 0, color: colors[Math.floor(Math.random() * colors.length)],
    input: { x: 0, z: 0 }, lastMove: Date.now()
  };
  players.set(id, player);
  send(ws, { type: "welcome", id, color: player.color });
  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type === "join") {
      const clean = String(msg.name || "Oyuncu").replace(/[<>]/g, "").trim().slice(0, 16);
      player.name = clean || "Oyuncu";
    } else if (msg.type === "move") {
      const x = Number(msg.x), z = Number(msg.z);
      if (Number.isFinite(x) && Number.isFinite(z)) {
        const len = Math.hypot(x, z) || 1;
        player.input = { x: Math.max(-1, Math.min(1, x/len)), z: Math.max(-1, Math.min(1, z/len)) };
      }
    }
  });
  ws.on("close", () => players.delete(id));
});

setInterval(() => {
  const now = Date.now();
  for (const p of players.values()) {
    const dt = Math.min((now - p.lastMove) / 1000, 0.05);
    p.lastMove = now;
    const speed = Math.max(5.5 - p.score * 0.018, 3.2);
    p.x += p.input.x * speed * dt;
    p.z += p.input.z * speed * dt;
    p.x = Math.max(-ARENA/2 + 1, Math.min(ARENA/2 - 1, p.x));
    p.z = Math.max(-ARENA/2 + 1, Math.min(ARENA/2 - 1, p.z));

    const radius = Math.min(0.85 + p.score * 0.012, 1.65);
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      if (Math.hypot(p.x - f.x, p.z - f.z) < radius + 0.55) {
        p.score += f.value;
        foods.splice(i, 1, makeFood());
      }
    }
  }
  const state = JSON.stringify(snapshot());
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(state);
  }
}, 50);

app.use(express.static("public"));
app.get("/health", (_req, res) => res.json({ ok: true, players: players.size }));
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Arena IO 3D hazır: http://localhost:${PORT}`);
});
