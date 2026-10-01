import { EventEmitter } from 'events';

class RealtimeBroadcaster extends EventEmitter {}

export const realtimeEvents = new RealtimeBroadcaster();
realtimeEvents.setMaxListeners(200);

const sseClients = new Set();

export function addSseClient(res) {
  sseClients.add(res);
  res.on('close', () => {
    sseClients.delete(res);
  });
}

export function broadcastDatabaseEvent(eventType, payload = {}) {
  const eventData = {
    type: eventType,
    timestamp: new Date().toISOString(),
    ...payload
  };

  // Emit to local node event emitter
  realtimeEvents.emit('db_change', eventData);

  // Broadcast to all active SSE client HTTP connections
  const message = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}
