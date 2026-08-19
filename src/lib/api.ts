import {
  Alert,
  AuditLog,
  DashboardSummary,
  Incident,
  ModelMetric,
  NotificationItem,
  RAGDocument,
  SecurityEvent,
  User,
} from '../types';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `API Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error?.message) errorMsg = errJson.error.message;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Auth
  login: (credentials: { email?: string; password?: string; role?: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<User>('/api/auth/me'),

  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/api/dashboard/summary'),

  // Events
  getEvents: (params?: { page?: number; limit?: number; search?: string; eventType?: string; threatOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', params.page.toString());
    if (params?.limit) q.set('limit', params.limit.toString());
    if (params?.search) q.set('search', params.search);
    if (params?.eventType) q.set('eventType', params.eventType);
    if (params?.threatOnly) q.set('threatOnly', 'true');
    return fetch(`/api/events?${q.toString()}`).then(r => r.json());
  },
  getEventById: (id: string) => request<SecurityEvent>(`/api/events/${id}`),
  ingestEvent: (event: Partial<SecurityEvent>) =>
    request<{ event: SecurityEvent; alert?: Alert }>('/api/events/ingest', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  uploadLogs: (logs: Partial<SecurityEvent>[], filename?: string) =>
    request<{ ingested_count: number; threats_identified: number; message: string }>('/api/logs/upload', {
      method: 'POST',
      body: JSON.stringify({ logs, filename }),
    }),

  // Alerts
  getAlerts: (params?: { severity?: string; status?: string; search?: string; threatType?: string }) => {
    const q = new URLSearchParams();
    if (params?.severity) q.set('severity', params.severity);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.threatType) q.set('threatType', params.threatType);
    return request<Alert[]>(`/api/alerts?${q.toString()}`);
  },
  getAlertById: (id: string) => request<Alert>(`/api/alerts/${id}`),
  updateAlert: (id: string, updates: Partial<Alert>) =>
    request<Alert>(`/api/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  addAlertNote: (id: string, text: string, author: string, role: string) =>
    request<Alert>(`/api/alerts/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text, author, role }),
    }),
  executeContainment: (id: string, action: string) =>
    request<Alert>(`/api/alerts/${id}/contain`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  // Incidents
  getIncidents: () => request<Incident[]>('/api/incidents'),
  getIncidentById: (id: string) => request<Incident>(`/api/incidents/${id}`),
  createIncident: (data: { title: string; description: string; severity: string; alert_ids: string[]; assigned_analyst: string }) =>
    request<Incident>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIncident: (id: string, updates: Partial<Incident>) =>
    request<Incident>(`/api/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // ML Detection
  analyzeRawLog: (event: Partial<SecurityEvent>) =>
    request<any>('/api/detection/analyze', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  getModels: () => request<ModelMetric[]>('/api/models'),
  getModelById: (id: string) => request<ModelMetric>(`/api/models/${id}`),

  // RAG Knowledge Base
  getDocuments: () => request<RAGDocument[]>('/api/knowledge/documents'),
  uploadDocument: (data: { title: string; category: string; content: string; file_type?: string; uploaded_by?: string }) =>
    request<RAGDocument>('/api/knowledge/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteDocument: (id: string) =>
    request<{ message: string }>(`/api/knowledge/documents/${id}`, {
      method: 'DELETE',
    }),
  searchKnowledge: (query: string, top_k: number = 3) =>
    request<any[]>('/api/knowledge/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k }),
    }),

  // Sentinel Copilot Chat
  sendMessage: (data: { session_id?: string; message: string; context?: { alert_id?: string; incident_id?: string }; userRole?: string }) =>
    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  getChatSessions: () => request<any[]>('/api/chat/sessions'),
  deleteChatSession: (id: string) =>
    request<{ message: string }>(`/api/chat/sessions/${id}`, {
      method: 'DELETE',
    }),

  // Audit Logs & Health
  getAuditLogs: () => request<AuditLog[]>('/api/audit-logs'),
  getHealth: () => request<any>('/api/health'),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<void>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<void>('/api/notifications/read-all', { method: 'POST' }),

  // Demo Controls
  resetDemoDataset: () =>
    request<{ message: string }>('/api/demo/reset', { method: 'POST' }),
  simulateAttack: (attackType: string) =>
    request<{ event: SecurityEvent; alert?: Alert }>('/api/demo/simulate-attack', {
      method: 'POST',
      body: JSON.stringify({ attackType }),
    }),
};
