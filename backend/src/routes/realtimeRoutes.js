import express from 'express';
import { addSseClient, realtimeEvents } from '../realtime.js';

const router = express.Router();

// Real-Time Server-Sent Events (SSE) Stream Endpoint
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial handshake message
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString(), message: 'Live database connection established' })}\n\n`);

  addSseClient(res);

  // Send heartbeat keep-alive ping every 15s to keep connections alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (err) {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Polling fallback endpoint for clients that prefer request/response polling
const recentEvents = [];
realtimeEvents.on('db_change', (event) => {
  recentEvents.push(event);
  if (recentEvents.length > 100) {
    recentEvents.shift();
  }
});

router.get('/poll', (req, res) => {
  const since = req.query.since ? new Date(req.query.since).getTime() : 0;
  const events = recentEvents.filter(e => new Date(e.timestamp).getTime() > since);
  return res.json({
    success: true,
    serverTime: new Date().toISOString(),
    events
  });
});

export default router;
