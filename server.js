const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const { configureSockets } = require('./socketHandlers');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(routes);

configureSockets(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor em http://localhost:${PORT}`);
});
