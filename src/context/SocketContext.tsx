import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Incident, SecurityEvent } from '../types';
import { api } from '../lib/api';

interface SocketContextType {
  isConnected: boolean;
  liveEvents: SecurityEvent[];
  latestAlert: Alert | null;
  isSimulating: boolean;
  simulationInterval: number;
  toggleSimulation: () => void;
  setSimulationSpeed: (ms: number) => void;
  triggerAttackSimulation: (type: string) => Promise<void>;
  clearLiveEvents: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [liveEvents, setLiveEvents] = useState<SecurityEvent[]>([]);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationInterval, setSimulationInterval] = useState(3000);

  // Connect to SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/stream/events');

      eventSource.addEventListener('handshake', () => {
        setIsConnected(true);
      });

      eventSource.addEventListener('security_event', (e: MessageEvent) => {
        try {
          const event: SecurityEvent = JSON.parse(e.data);
          setLiveEvents(prev => [event, ...prev.slice(0, 49)]);
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.addEventListener('new_alert', (e: MessageEvent) => {
        try {
          const alert: Alert = JSON.parse(e.data);
          setLatestAlert(alert);
        } catch (err) {
          console.error('SSE parse alert error:', err);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Background synthetic generator when isSimulating is active
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(async () => {
      const attackTypes = ['NORMAL', 'NORMAL', 'NORMAL', 'BRUTE_FORCE', 'PORT_SCAN', 'NORMAL', 'DDOS_BURST'];
      const randomType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
      try {
        await api.simulateAttack(randomType);
      } catch {
        // quiet fallback
      }
    }, simulationInterval);

    return () => clearInterval(timer);
  }, [isSimulating, simulationInterval]);

  const toggleSimulation = () => {
    setIsSimulating(prev => !prev);
  };

  const setSimulationSpeed = (ms: number) => {
    setSimulationInterval(ms);
  };

  const triggerAttackSimulation = async (type: string) => {
    try {
      const res = await api.simulateAttack(type);
      if (res.event) {
        setLiveEvents(prev => [res.event, ...prev.slice(0, 49)]);
      }
      if (res.alert) {
        setLatestAlert(res.alert);
      }
    } catch (err) {
      console.error('Trigger attack error:', err);
    }
  };

  const clearLiveEvents = () => {
    setLiveEvents([]);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        liveEvents,
        latestAlert,
        isSimulating,
        simulationInterval,
        toggleSimulation,
        setSimulationSpeed,
        triggerAttackSimulation,
        clearLiveEvents,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
}
