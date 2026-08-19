import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db/database';
import { sentinelCopilot } from './server/ai/gemini';
import { vectorStore } from './server/rag/vectorStore';
import { DocumentProcessor } from './server/rag/documentProcessor';
import { modelMetricsData } from './server/ml/modelMetrics';
import { computeFeatures } from './server/ml/featureEngineering';
import { isolationForest } from './server/ml/isolationForest';
import { threatClassifier } from './server/ml/threatClassifier';
import { riskEngine } from './server/ml/riskEngine';
import { explainableAI } from './server/ml/explainableAI';
import { EventType, UserRole } from './src/types';

// In-memory chat sessions
const chatSessions: Record<string, any> = {};

// SSE Clients for real-time streaming
const sseClients: Set<Response> = new Set();

function broadcastEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom API logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && !req.path.startsWith('/api/stream')) {
      // Nominal API log
    }
    next();
  });

  // ----------------------------------------------------
  // AUTHENTICATION & RBAC
  // ----------------------------------------------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, role } = req.body;
    let user = db.getUserByEmail(email);

    if (!user) {
      // Default to requested or Analyst
      const targetRole: UserRole = role || (email?.includes('admin') ? 'ADMIN' : email?.includes('viewer') ? 'VIEWER' : 'ANALYST');
      user = {
        id: `usr-${Date.now()}`,
        name: email ? email.split('@')[0].replace('.', ' ').toUpperCase() : 'Security Analyst',
        email: email || 'analyst@sentinel.ai',
        role: targetRole,
        department: 'Security Operations Center',
        lastLogin: new Date().toISOString(),
      };
    }

    db.addAuditLog({
      user_email: user.email,
      user_role: user.role,
      action: 'USER_LOGIN',
      resource: 'Sentinel Auth Gateway',
      ip_address: req.ip || '127.0.0.1',
      status: 'SUCCESS',
      details: `User ${user.email} (${user.role}) authenticated successfully.`,
    });

    res.json({
      success: true,
      token: `jwt_mock_${user.id}_${Date.now()}`,
      user,
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const defaultUser = db.getUsers()[0];
    res.json({ success: true, user: defaultUser });
  });

  // ----------------------------------------------------
  // DASHBOARD SUMMARY
  // ----------------------------------------------------
  app.get('/api/dashboard/summary', (req: Request, res: Response) => {
    const summary = db.getDashboardSummary();
    res.json({ success: true, data: summary });
  });

  // ----------------------------------------------------
  // SECURITY EVENTS
  // ----------------------------------------------------
  app.get('/api/events', (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = (req.query.search as string) || '';
    const eventType = (req.query.eventType as string) || 'ALL';
    const threatOnly = req.query.threatOnly === 'true';

    const result = db.getEvents({ page, limit, search, eventType, threatOnly });
    res.json({ success: true, ...result });
  });

  app.get('/api/events/:id', (req: Request, res: Response) => {
    const event = db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: { message: 'Event not found' } });
    }
    res.json({ success: true, data: event });
  });

  app.post('/api/events/ingest', (req: Request, res: Response) => {
    const rawEvent = req.body;
    const { event, alert } = db.ingestEvent(rawEvent);

    broadcastEvent('security_event', event);
    if (alert) {
      broadcastEvent('new_alert', alert);
    }

    res.status(201).json({ success: true, data: { event, alert } });
  });

  app.post('/api/logs/upload', (req: Request, res: Response) => {
    const { logs, filename } = req.body;
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATASET', message: 'Dataset must be a non-empty array of security log records.' },
      });
    }

    let ingestedCount = 0;
    let threatsFound = 0;

    for (const log of logs.slice(0, 100)) {
      const { event, alert } = db.ingestEvent(log);
      ingestedCount++;
      if (event.is_threat) threatsFound++;
    }

    db.addAuditLog({
      user_email: 'analyst@sentinel.ai',
      user_role: 'ANALYST',
      action: 'LOG_DATASET_INGESTED',
      resource: filename || 'Batch Upload',
      ip_address: req.ip || '127.0.0.1',
      status: 'SUCCESS',
      details: `Processed ${ingestedCount} log records from ${filename || 'upload'}. Identified ${threatsFound} anomalous events.`,
    });

    res.json({
      success: true,
      data: {
        ingested_count: ingestedCount,
        threats_identified: threatsFound,
        message: `Successfully processed ${ingestedCount} security log events.`,
      },
    });
  });

  // ----------------------------------------------------
  // ALERTS & INVESTIGATION
  // ----------------------------------------------------
  app.get('/api/alerts', (req: Request, res: Response) => {
    const severity = (req.query.severity as string) || 'ALL';
    const status = (req.query.status as string) || 'ALL';
    const search = (req.query.search as string) || '';
    const threatType = (req.query.threatType as string) || 'ALL';

    const alerts = db.getAlerts({ severity, status, search, threatType });
    res.json({ success: true, data: alerts, count: alerts.length });
  });

  app.get('/api/alerts/:id', (req: Request, res: Response) => {
    const alert = db.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    }
    res.json({ success: true, data: alert });
  });

  app.patch('/api/alerts/:id', (req: Request, res: Response) => {
    const updated = db.updateAlert(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    }
    broadcastEvent('alert_updated', updated);
    res.json({ success: true, data: updated });
  });

  app.post('/api/alerts/:id/notes', (req: Request, res: Response) => {
    const { text, author, role } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: { message: 'Note text is required' } });
    }
    const updated = db.addAlertNote(req.params.id, text, author || 'Analyst', role || 'ANALYST');
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    }
    res.json({ success: true, data: updated });
  });

  app.post('/api/alerts/:id/contain', (req: Request, res: Response) => {
    const { action } = req.body;
    const alert = db.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    }

    if (!alert.containment_actions_taken.includes(action)) {
      alert.containment_actions_taken.push(action);
    }
    alert.status = 'INVESTIGATING';

    db.addAuditLog({
      user_email: 'analyst@sentinel.ai',
      user_role: 'ANALYST',
      action: 'CONTAINMENT_EXECUTED',
      resource: `${alert.id} (${action})`,
      ip_address: req.ip || '127.0.0.1',
      status: 'SUCCESS',
      details: `Executed containment action "${action}" on alert ${alert.id} against source ${alert.source_ip}.`,
    });

    broadcastEvent('alert_updated', alert);
    res.json({ success: true, data: alert });
  });

  // ----------------------------------------------------
  // INCIDENTS
  // ----------------------------------------------------
  app.get('/api/incidents', (req: Request, res: Response) => {
    const incidents = db.getIncidents();
    res.json({ success: true, data: incidents });
  });

  app.get('/api/incidents/:id', (req: Request, res: Response) => {
    const incident = db.getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: { message: 'Incident not found' } });
    }
    res.json({ success: true, data: incident });
  });

  app.post('/api/incidents', (req: Request, res: Response) => {
    const { title, description, severity, alert_ids, assigned_analyst } = req.body;
    if (!title || !alert_ids || alert_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title and at least one linked alert_id are required' },
      });
    }

    const incident = db.createIncident({
      title,
      description: description || 'Multi-alert security incident created by SOC analyst.',
      severity: severity || 'HIGH',
      alert_ids,
      assigned_analyst: assigned_analyst || 'Marcus Thorne',
    });

    broadcastEvent('new_incident', incident);
    res.status(201).json({ success: true, data: incident });
  });

  app.patch('/api/incidents/:id', (req: Request, res: Response) => {
    const updated = db.updateIncident(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Incident not found' } });
    }
    broadcastEvent('incident_updated', updated);
    res.json({ success: true, data: updated });
  });

  // ----------------------------------------------------
  // ML DETECTION & EXPLAINABILITY
  // ----------------------------------------------------
  app.post('/api/detection/analyze', (req: Request, res: Response) => {
    const rawEvent = req.body;
    const features = computeFeatures(rawEvent);
    const anomaly = isolationForest.predictAnomaly(features);
    const classification = threatClassifier.classify(rawEvent, features, anomaly);
    const risk = riskEngine.calculateRisk(features, anomaly, classification, rawEvent.event_type || 'NORMAL_TRAFFIC');
    const explanation = explainableAI.generateExplanation(rawEvent, features, anomaly, classification, risk.risk_score);

    res.json({
      success: true,
      data: {
        features,
        anomaly,
        classification,
        risk,
        explanation,
      },
    });
  });

  app.get('/api/models', (req: Request, res: Response) => {
    res.json({ success: true, data: modelMetricsData });
  });

  app.get('/api/models/:id', (req: Request, res: Response) => {
    const model = modelMetricsData.find(m => m.id === req.params.id);
    if (!model) {
      return res.status(404).json({ success: false, error: { message: 'Model not found' } });
    }
    res.json({ success: true, data: model });
  });

  // ----------------------------------------------------
  // RAG KNOWLEDGE BASE
  // ----------------------------------------------------
  app.get('/api/knowledge/documents', (req: Request, res: Response) => {
    const docs = vectorStore.getAllDocuments();
    res.json({ success: true, data: docs });
  });

  app.post('/api/knowledge/upload', (req: Request, res: Response) => {
    const { title, category, content, file_type, uploaded_by } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: { message: 'Document title and content are required' } });
    }

    const chunks = DocumentProcessor.chunkDocument(title, content);
    const newDoc = {
      id: `doc-${Date.now()}`,
      title,
      category: category || 'USER_UPLOAD',
      file_type: file_type || 'MARKDOWN',
      file_size_kb: Math.round(content.length / 1024) || 1,
      uploaded_at: new Date().toISOString(),
      uploaded_by: uploaded_by || 'analyst@sentinel.ai',
      status: 'INDEXED' as const,
      chunk_count: chunks.length,
      vector_dimensions: 768,
      snippet: content.slice(0, 180) + '...',
      chunks,
    };

    vectorStore.addDocument(newDoc);

    db.addAuditLog({
      user_email: uploaded_by || 'analyst@sentinel.ai',
      user_role: 'ANALYST',
      action: 'DOCUMENT_UPLOADED',
      resource: title,
      ip_address: req.ip || '127.0.0.1',
      status: 'SUCCESS',
      details: `Indexed new document "${title}" into vector store (${chunks.length} chunks).`,
    });

    res.status(201).json({ success: true, data: newDoc });
  });

  app.delete('/api/knowledge/documents/:id', (req: Request, res: Response) => {
    const deleted = vectorStore.deleteDocument(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { message: 'Document not found' } });
    }

    db.addAuditLog({
      user_email: 'admin@sentinel.ai',
      user_role: 'ADMIN',
      action: 'DOCUMENT_DELETED',
      resource: req.params.id,
      ip_address: req.ip || '127.0.0.1',
      status: 'SUCCESS',
      details: `Deleted knowledge document ${req.params.id} from vector store.`,
    });

    res.json({ success: true, message: 'Document deleted successfully' });
  });

  app.post('/api/knowledge/search', (req: Request, res: Response) => {
    const { query, top_k } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: { message: 'Query is required' } });
    }
    const results = vectorStore.search(query, top_k || 3);
    res.json({ success: true, data: results });
  });

  // ----------------------------------------------------
  // SENTINEL COPILOT (CHATBOT)
  // ----------------------------------------------------
  app.post('/api/chat/message', async (req: Request, res: Response) => {
    const { session_id, message, context, userRole } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: { message: 'Message cannot be empty' } });
    }

    const sessionId = session_id || `sess-${Date.now()}`;
    if (!chatSessions[sessionId]) {
      chatSessions[sessionId] = {
        id: sessionId,
        title: message.slice(0, 35) + '...',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      };
    }

    // Add user message
    const userMsg = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    chatSessions[sessionId].messages.push(userMsg);

    try {
      const response = await sentinelCopilot.ask({
        message,
        context,
        userRole: userRole || 'ANALYST',
      });

      const assistantMsg = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        sources: response.sources,
        referenced_alerts: response.referenced_alerts,
        referenced_incidents: response.referenced_incidents,
        is_live_db_query: response.is_live_db_query,
        confidence: response.confidence,
        query_category: response.query_category,
      };

      chatSessions[sessionId].messages.push(assistantMsg);
      chatSessions[sessionId].updated_at = new Date().toISOString();

      db.addAuditLog({
        user_email: 'analyst@sentinel.ai',
        user_role: (userRole as UserRole) || 'ANALYST',
        action: 'COPILOT_QUERY',
        resource: 'Sentinel Copilot',
        ip_address: req.ip || '127.0.0.1',
        status: 'SUCCESS',
        details: `Copilot processed query: "${message.slice(0, 50)}..."`,
      });

      res.json({
        success: true,
        session_id: sessionId,
        data: assistantMsg,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'CHAT_ERROR', message: err.message || 'Error processing Copilot request' },
      });
    }
  });

  app.get('/api/chat/sessions', (req: Request, res: Response) => {
    const list = Object.values(chatSessions).sort(
      (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    res.json({ success: true, data: list });
  });

  app.get('/api/chat/sessions/:id', (req: Request, res: Response) => {
    const session = chatSessions[req.params.id];
    if (!session) {
      return res.status(404).json({ success: false, error: { message: 'Session not found' } });
    }
    res.json({ success: true, data: session });
  });

  app.delete('/api/chat/sessions/:id', (req: Request, res: Response) => {
    delete chatSessions[req.params.id];
    res.json({ success: true, message: 'Session deleted' });
  });

  // ----------------------------------------------------
  // AUDIT LOGS & HEALTH
  // ----------------------------------------------------
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const logs = db.getAuditLogs();
    res.json({ success: true, data: logs });
  });

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      version: '1.2.0-sentinel-soc',
      database: 'CONNECTED',
      ml_inference: 'ONLINE',
      rag_store: 'ONLINE',
      gemini_llm: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'LOCAL_DEFENSIVE_FALLBACK',
    });
  });

  // ----------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------
  app.get('/api/notifications', (req: Request, res: Response) => {
    const notifs = db.getNotifications();
    res.json({ success: true, data: notifs });
  });

  app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
    db.markNotificationAsRead(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    db.markAllNotificationsAsRead();
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // DEMO DATASET & SYNTHETIC ATTACK INJECTOR
  // ----------------------------------------------------
  app.post('/api/demo/reset', (req: Request, res: Response) => {
    db.loadDemoDataset();
    broadcastEvent('dataset_reloaded', { message: 'Demo dataset reloaded' });
    res.json({ success: true, message: 'Synthetic demo dataset reloaded successfully.' });
  });

  app.post('/api/demo/simulate-attack', (req: Request, res: Response) => {
    const { attackType } = req.body;

    const attackMap: Record<string, Partial<any>> = {
      BRUTE_FORCE: {
        source_ip: '185.190.140.' + Math.floor(Math.random() * 250),
        destination_ip: '10.0.1.15',
        source_port: 52000 + Math.floor(Math.random() * 8000),
        destination_port: 22,
        protocol: 'SSH',
        bytes_sent: 5600,
        bytes_received: 1400,
        packet_count: 70,
        duration_ms: 800,
        request_count: 32,
        failed_login_count: 24,
        login_attempts: 24,
        user_id: 'root',
        device_id: 'bastion-host-01',
        country: 'Russian Federation',
        country_code: 'RU',
        lat: 55.7558,
        lng: 37.6173,
        authentication_status: 'FAILED',
        event_type: 'BRUTE_FORCE',
        response_code: 401,
        user_agent: 'libssh2/1.10.0 (Automated Dictionary Attack)',
      },
      PORT_SCAN: {
        source_ip: '91.240.118.' + Math.floor(Math.random() * 250),
        destination_ip: '10.0.0.1',
        source_port: 49000 + Math.floor(Math.random() * 10000),
        destination_port: Math.floor(Math.random() * 1024),
        protocol: 'TCP',
        bytes_sent: 14200,
        bytes_received: 600,
        packet_count: 340,
        duration_ms: 2400,
        request_count: 500,
        failed_login_count: 0,
        login_attempts: 0,
        device_id: 'perimeter-router-01',
        country: 'Netherlands',
        country_code: 'NL',
        lat: 52.3676,
        lng: 4.9041,
        authentication_status: 'NONE',
        event_type: 'PORT_SCAN',
        response_code: 404,
        user_agent: 'Mozilla/5.0 (compatible; Nmap Scripting Engine)',
      },
      DATA_EXFILTRATION: {
        source_ip: '203.0.113.' + Math.floor(Math.random() * 250),
        destination_ip: '10.0.4.80',
        source_port: 59000,
        destination_port: 443,
        protocol: 'HTTPS',
        bytes_sent: 54000000,
        bytes_received: 38000,
        packet_count: 36000,
        duration_ms: 19500,
        request_count: 180,
        failed_login_count: 0,
        login_attempts: 1,
        user_id: 'svc-backup-prod',
        device_id: 'db-cluster-03',
        country: 'China',
        country_code: 'CN',
        lat: 31.2304,
        lng: 121.4737,
        authentication_status: 'SUCCESS',
        event_type: 'DATA_EXFILTRATION',
        response_code: 200,
        user_agent: 'Python-urllib/3.11 aiohttp/3.8.5',
      },
      DDOS_BURST: {
        source_ip: '194.26.29.' + Math.floor(Math.random() * 250),
        destination_ip: '10.0.2.10',
        source_port: 53120,
        destination_port: 80,
        protocol: 'HTTP',
        bytes_sent: 280000,
        bytes_received: 1200,
        packet_count: 8500,
        duration_ms: 1200,
        request_count: 1200,
        failed_login_count: 0,
        login_attempts: 0,
        device_id: 'public-lb-01',
        country: 'Brazil',
        country_code: 'BR',
        lat: -23.5505,
        lng: -46.6333,
        authentication_status: 'NONE',
        event_type: 'DDOS_BURST',
        response_code: 503,
        user_agent: 'Mozilla/5.0 (Slowloris/Layer-7 Flood Botnet)',
      },
      NORMAL: {
        source_ip: '10.0.2.' + Math.floor(Math.random() * 200),
        destination_ip: '10.0.1.10',
        source_port: 51000 + Math.floor(Math.random() * 5000),
        destination_port: 443,
        protocol: 'HTTPS',
        bytes_sent: 1840,
        bytes_received: 4200,
        packet_count: 24,
        duration_ms: 320,
        request_count: 2,
        failed_login_count: 0,
        login_attempts: 1,
        user_id: 'j.smith',
        device_id: 'workstation-dev-42',
        country: 'United States',
        country_code: 'US',
        lat: 37.7749,
        lng: -122.4194,
        authentication_status: 'SUCCESS',
        event_type: 'NORMAL_TRAFFIC',
        response_code: 200,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
    };

    const targetPattern = attackMap[attackType || 'BRUTE_FORCE'] || attackMap.BRUTE_FORCE;
    const { event, alert } = db.ingestEvent(targetPattern);

    broadcastEvent('security_event', event);
    if (alert) {
      broadcastEvent('new_alert', alert);
    }

    res.json({
      success: true,
      data: { event, alert },
      message: `Injected synthetic ${attackType || 'BRUTE_FORCE'} telemetry successfully.`,
    });
  });

  // ----------------------------------------------------
  // REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
  // ----------------------------------------------------
  app.get('/api/stream/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Send initial handshake
    res.write(`event: handshake\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE / STATIC ASSETS
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SENTINEL AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
