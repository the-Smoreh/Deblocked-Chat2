const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname)));

const COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8",
  "#f58231", "#911eb4", "#46f0f0", "#f032e6",
  "#bcf60c", "#fabebe", "#008080", "#e6beff",
  "#9a6324", "#fffac8", "#800000", "#aaffc3"
];

const userColors = new Map();

wss.on("connection", ws => {
  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if (!userColors.has(data.username)) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      userColors.set(data.username, color);
    }

    const payload = {
      username: data.username,
      message: data.message,
      color: userColors.get(data.username)
    };

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
      }
    });
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
