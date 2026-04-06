const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const betterSqlite3 = require('better-sqlite3');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = new betterSqlite3('./data/database.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    progress TEXT DEFAULT '{}'
  );
`);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Clicker API
app.get('/api/clicker/:playerId', (req, res) => {
  const player = db.prepare('SELECT progress FROM players WHERE id = ?').get(req.params.playerId);
  res.json(player ? JSON.parse(player.progress) : { clicks: 0, level: 1, xp: 0, currency: 100, upgrades: { multiplier: 1 }, prestige: 0 });
});

app.post('/api/clicker/:playerId', express.json(), (req, res) => {
  db.prepare('INSERT OR REPLACE INTO players (id, progress) VALUES (?, ?)').run(req.params.playerId, JSON.stringify(req.body));
  res.json({ success: true });
});

// Game logic imports
const ginRummyLogic = require('./game-logic/ginRummyLogic');

// Realtime Gin Rummy
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('gin-create-room', (mode) => {
    const roomId = 'room-' + Math.random().toString(36).slice(2, 8);
    rooms.set(roomId, ginRummyLogic.createNewGame(mode, socket.id));
    socket.join(roomId);
    socket.emit('gin-room-created', roomId);
    io.to(roomId).emit('gin-state-update', rooms.get(roomId).publicState);
  });

  socket.on('gin-join-room', (roomId) => {
    const game = rooms.get(roomId);
    if (game && game.players.length < 2) {
      socket.join(roomId);
      game.players.push(socket.id);
      io.to(roomId).emit('gin-state-update', game.publicState);
    }
  });

  socket.on('gin-player-action', ({ roomId, action }) => {
    const game = rooms.get(roomId);
    if (!game) return;
    const result = ginRummyLogic.processAction(game, socket.id, action);
    if (result.valid) {
      io.to(roomId).emit('gin-state-update', game.publicState);
      if (result.gameOver) io.to(roomId).emit('gin-game-over', result.winner);
    } else {
      socket.emit('gin-invalid-action', result.message);
    }
  });

  socket.on('disconnect', () => console.log('Player disconnected:', socket.id));
});

server.listen(3000, () => console.log('🚪 AetherGate running → http://localhost:3000'));