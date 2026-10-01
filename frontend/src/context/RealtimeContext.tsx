import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface DatabaseEvent {
  type: string;
  timestamp: string;
  collection?: string;
  action?: string;
  item?: any;
  id?: string;
  [key: string]: any;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: DatabaseEvent | null;
  subscribe: (callback: (event: DatabaseEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastEvent: null,
  subscribe: () => () => {}
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<DatabaseEvent | null>(null);
  const [listeners, setListeners] = useState<Set<(event: DatabaseEvent) => void>>(new Set());

  const subscribe = useCallback((callback: (event: DatabaseEvent) => void) => {
    setListeners(prev => {
      const next = new Set(prev);
      next.add(callback);
      return next;
    });
    return () => {
      setListeners(prev => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    try {
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const data: DatabaseEvent = JSON.parse(e.data);
          setLastEvent(data);
          listeners.forEach(cb => cb(data));
        } catch (err) {
          console.error('Failed to parse SSE payload:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // Fallback polling if SSE drops
        if (!pollInterval) {
          let lastCheckTime = new Date().toISOString();
          pollInterval = setInterval(async () => {
            try {
              const res = await fetch(`/api/realtime/poll?since=${encodeURIComponent(lastCheckTime)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.events && data.events.length > 0) {
                  data.events.forEach((ev: DatabaseEvent) => {
                    setLastEvent(ev);
                    listeners.forEach(cb => cb(ev));
                  });
                }
                lastCheckTime = data.serverTime || new Date().toISOString();
                setIsConnected(true);
              }
            } catch (pErr) {
              setIsConnected(false);
            }
          }, 4000);
        }
      };
    } catch (err) {
      setIsConnected(false);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [listeners]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
