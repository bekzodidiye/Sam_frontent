/**
 * useWebSocket - Production-ready WebSocket hook for React
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state (connected, disconnected, error)
 * - Clean unmounting (closes socket when component unmounts)
 * - Event listener via onMessage callback
 * - Token-based JWT auth via query string
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketOptions {
  /** Called on every message received from the server */
  onMessage: (data: any) => void;
  /** Called when the connection status changes */
  onStatusChange?: (status: WsStatus) => void;
  /** Maximum reconnect attempts before giving up (default: 10) */
  maxRetries?: number;
  /** Disabled flag - if true, the socket won't be created */
  disabled?: boolean;
}

/**
 * Derives the WebSocket URL using the known backend host.
 * The BACKEND_WS_HOST can be changed to match your deployment.
 */
function getWsUrl(token: string | null): string {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) {
    // If it's a full URL, use it
    if (envUrl.startsWith('ws://') || envUrl.startsWith('wss://')) {
      return `${envUrl}${envUrl.includes('?') ? '&' : '?'}token=${token}`;
    }
    // If it's just a path or relative URL, try to prepend protocol/host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${envUrl}/ws/notifications/?token=${token}`;
  }

  // Fallback for local development if no env var
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Local often uses 8003 for Django
  const host = isLocal ? `${hostname}:8003` : window.location.host;
  
  // Force insecure WS on localhost unless already on HTTPS
  const finalProtocol = (isLocal && window.location.protocol !== 'https:') ? 'ws:' : protocol;
  
  return `${finalProtocol}//${host}/ws/notifications/?token=${token}`;
}


const INITIAL_RECONNECT_DELAY_MS = 1000; // 1 second for first retry
const MAX_RECONNECT_DELAY_MS = 30000;    // Cap at 30 seconds

export function useWebSocket(options: UseWebSocketOptions) {
  const { onMessage, onStatusChange, maxRetries = 10, disabled = false } = options;

  const [status, setStatus] = useState<WsStatus>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Keep callbacks in a ref so they don't trigger reconnects
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const updateStatus = useCallback((s: WsStatus) => {
    setStatus(s);
    onStatusChangeRef.current?.(s);
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current || disabled) return;

    const token = localStorage.getItem('paynet_auth_token');
    if (!token) {
      console.warn('[useWebSocket] No auth token found, skipping connection.');
      return;
    }

    const url = getWsUrl(token);
    console.log(`[useWebSocket] Connecting to: ${url}`);
    updateStatus('connecting');

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      if (!isMountedRef.current) return;
      console.log('[useWebSocket] Connected.');
      retryCountRef.current = 0; // Reset retry count on success
      updateStatus('connected');
    };

    socket.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (e) {
        console.error('[useWebSocket] Failed to parse message:', e);
      }
    };

    socket.onerror = (err) => {
      console.error('[useWebSocket] Error:', err);
      updateStatus('error');
    };

    socket.onclose = (event) => {
      if (!isMountedRef.current) return;
      console.log(`[useWebSocket] Disconnected (code=${event.code}).`);
      socketRef.current = null;
      updateStatus('disconnected');

      // Attempt reconnect if not deliberately closed (code 1000) and retries left
      if (event.code !== 1000 && retryCountRef.current < maxRetries) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY_MS * Math.pow(2, retryCountRef.current),
          MAX_RECONNECT_DELAY_MS
        );
        retryCountRef.current += 1;
        console.log(`[useWebSocket] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})...`);
        retryTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else if (retryCountRef.current >= maxRetries) {
        console.error('[useWebSocket] Max reconnect attempts reached. Giving up.');
        updateStatus('error');
      }
    };
  }, [disabled, maxRetries, updateStatus]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!disabled) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      // Clear any pending reconnect timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      // Close the socket cleanly (code 1000 = normal closure)
      if (socketRef.current) {
        socketRef.current.close(1000);
        socketRef.current = null;
      }
    };
  }, [connect, disabled]);

  return { status };
}
