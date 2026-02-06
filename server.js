const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname)));

// Health check for Railway
app.get("/health", (req, res) => res.send("OK"));

const COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8",
  "#f58231", "#911eb4", "#46f0f0", "#f032e6",
  "#bcf60c", "#fabebe", "#008080", "#e6beff",
  "#9a6324", "#fffac8", "#800000", "#aaffc3"
];

const userColors = new Map();
let history = [];

// Add message to history with 300‑message limit
function addToHistory(msg) {
  history.push(msg);
  if (history.length > 300) {
    history.shift();
  }
}

// Broadcast to all clients
function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

// Broadcast online count
function broadcastOnlineCount() {
  broadcast({
    type: "online",
    count: wss.clients.size
  });
}

wss.on("connection", ws => {
  // Send history to new client
  ws.send(JSON.stringify({
    type: "history",
    history
  }));

  // Update online count
  broadcastOnlineCount();

  ws.on("close", () => {
    broadcastOnlineCount();
  });

  ws.on("message", msg => {
    let data;

    // Safe JSON parsing
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.error("Invalid JSON:", msg);
      return;
    }

    // Assign color if new user
    if (!userColors.has(data.username)) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      userColors.set(data.username, color);
    }

    // Build payload
    const payload = {
      type: data.type,
      username: data.username,
      color: userColors.get(data.username)
    };

    if (data.type === "text") {
      payload.message = data.message;
    }

    if (data.type === "image") {
      payload.image = data.image;
    }

    // Save to history
    addToHistory(payload);

    // Broadcast to all clients
    broadcast(payload);
  });
});

// Railway‑compatible port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
