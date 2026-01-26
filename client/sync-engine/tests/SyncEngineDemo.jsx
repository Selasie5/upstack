import React, { useState, useEffect, useRef } from 'react';
import { ClientSyncEngine, SyncState } from './SyncEngine';

/**
 * Interactive Demo Component for Client Sync Engine
 * Visualizes sync state machine and operations
 */
const SyncEngineDemo = () => {
  const [engine] = useState(() => new ClientSyncEngine({ 
    scanInterval: 3000,
    maxRetries: 3 
  }));
  
  const [state, setState] = useState(SyncState.IDLE);
  const [stats, setStats] = useState(engine.getStats());
  const [events, setEvents] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  
  const eventsEndRef = useRef(null);

  useEffect(() => {
    // Subscribe to engine events
    const unsubscribe = engine.subscribe((event) => {
      // Update state
      if (event.type === 'STATE_CHANGE') {
        setState(event.newState);
      }
      
      // Add to event log
      setEvents(prev => [...prev.slice(-20), event]);
      
      // Update stats
      setStats(engine.getStats());
    });

    return () => unsubscribe();
  }, [engine]);

  useEffect(() => {
    // Auto-scroll events
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleStart = async () => {
    setIsRunning(true);
    await engine.startScheduler();
  };

  const handleStop = () => {
    engine.stopScheduler();
    setIsRunning(false);
  };

  const handleToggleOnline = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    engine.setOnlineStatus(newStatus);
  };

  const handleReset = () => {
    engine.resetStats();
    setStats(engine.getStats());
    setEvents([]);
  };

  const getStateColor = (currentState) => {
    const colors = {
      [SyncState.IDLE]: 'bg-gray-200 text-gray-800',
      [SyncState.SCANNING]: 'bg-blue-200 text-blue-800',
      [SyncState.DECIDING]: 'bg-yellow-200 text-yellow-800',
      [SyncState.UPLOADING]: 'bg-green-200 text-green-800',
      [SyncState.DOWNLOADING]: 'bg-purple-200 text-purple-800',
      [SyncState.RETRYING]: 'bg-orange-200 text-orange-800',
      [SyncState.ERROR]: 'bg-red-200 text-red-800',
      [SyncState.SUCCESS]: 'bg-green-300 text-green-900'
    };
    return colors[currentState] || 'bg-gray-200 text-gray-800';
  };

  const getEventIcon = (eventType) => {
    const icons = {
      'STATE_CHANGE': '🔄',
      'CHANGES_DETECTED': '📁',
      'DECISION_MADE': '🤔',
      'UPLOAD_COMPLETE': '⬆️',
      'DOWNLOAD_COMPLETE': '⬇️',
      'CONFLICT_DETECTED': '⚠️',
      'RETRY_SCHEDULED': '🔁',
      'SYNC_FAILED': '❌',
      'NETWORK_STATUS': '🌐',
      'SCHEDULER_STARTED': '▶️',
      'SCHEDULER_STOPPED': '⏸️'
    };
    return icons[eventType] || '•';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          FEAT-002: Client Sync Engine Demo
        </h1>
        <p style={{ color: '#666' }}>
          Interactive demonstration of the synchronization state machine and operations
        </p>
      </div>

      {/* Control Panel */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={handleStart}
            disabled={isRunning}
            style={{
              padding: '10px 20px',
              backgroundColor: isRunning ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            ▶️ Start Scheduler
          </button>
          
          <button
            onClick={handleStop}
            disabled={!isRunning}
            style={{
              padding: '10px 20px',
              backgroundColor: !isRunning ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !isRunning ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            ⏸️ Stop Scheduler
          </button>
          
          <button
            onClick={handleToggleOnline}
            style={{
              padding: '10px 20px',
              backgroundColor: isOnline ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {isOnline ? '🌐 Online' : '📴 Offline'}
          </button>
          
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔄 Reset Stats
          </button>
        </div>
      </div>

      {/* State Display */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
          Current State
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ 
            padding: '20px 40px',
            borderRadius: '8px',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center'
          }} className={getStateColor(state)}>
            {state}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
          Statistics
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Syncs</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalSyncs}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Successful</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.successfulSyncs}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Failed</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.failedSyncs}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Retries Used</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{stats.retriesUsed}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#e2e3e5', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Queue Size</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.queueSize}</div>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
          Event Log
        </h2>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '13px'
        }}>
          {events.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No events yet. Start the scheduler to see activity.
            </div>
          ) : (
            events.map((event, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  borderLeft: '3px solid #007bff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {getEventIcon(event.type)} {event.type}
                  </span>
                  <span style={{ color: '#666', fontSize: '11px' }}>
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                {event.file && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    File: {event.file}
                  </div>
                )}
                {event.action && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Action: {event.action}
                  </div>
                )}
                {event.error && (
                  <div style={{ fontSize: '12px', color: '#dc3545' }}>
                    Error: {event.error}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={eventsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default SyncEngineDemo;