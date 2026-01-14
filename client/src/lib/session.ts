let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('bindery-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('bindery-session-id', sessionId);
      console.log('[Session] Created new session:', sessionId.substring(0, 8) + '...');
    } else {
      console.log('[Session] Loaded existing session:', sessionId.substring(0, 8) + '...');
    }
  }
  return sessionId;
}

export function getHeaders(): HeadersInit {
  const id = getSessionId();
  return {
    'X-Session-Id': id
  };
}
