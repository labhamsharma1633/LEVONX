import 'dotenv/config';

import express from 'express';
import http from 'http';
import { matchRouter } from './routes/matches.js';
import { attachWebSocketServer } from '../ws/server.js';
import { securityMiddleware } from './arcjet.js';
import { commentaryRouter } from './routes/commentary.js';

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from Express server');
});
app.use(securityMiddleware());
app.use('/matches', matchRouter);
app.use('/matches/:id/commentary',commentaryRouter);

const { broadcastMatchCreated, broadcastCommentaryCreated } = attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentaryCreated = broadcastCommentaryCreated;

server.listen(PORT, () => {
    const baseUrl = HOST === '0.0.0.0'
        ? `http://localhost:${PORT}`
        : `http://${HOST}:${PORT}`;

    console.log(`Server is running at ${baseUrl}`);
    console.log(`WebSocket endpoint available at ws://${HOST}:${PORT}/ws`);
});