import { Alert, AuditLog, DashboardSummary, EventType, Incident, NotificationItem, SecurityEvent, User, UserRole } from '../../src/types';
import { computeFeatures } from '../ml/featureEngineering';
import { isolationForest } from '../ml/isolationForest';
import { threatClassifier } from '../ml/threatClassifier';
import { riskEngine } from '../ml/riskEngine';
import { explainableAI } from '../ml/explainableAI';
import { seedAlerts, seedAuditLogs, seedIncidents, seedNotifications, seedSecurityEvents, seedUsers } from './seeds';

class SentinelDatabase {
  private users: User[] = [...seedUsers];
  private events: SecurityEvent[] = [...seedSecurityEvents];
  private alerts: Alert[] = [...seedAlerts];
  private incidents: Incident[] = [...seedIncidents];
  private auditLogs: AuditLog[] = [...seedAuditLogs];
  private notifications: NotificationItem[] = [...seedNotifications];

  // User management
  public getUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  // Security Events
  public getEvents(params: {
    page?: number;
    limit?: number;
    search?: string;
    eventType?: string;
    threatOnly?: boolean;
  }): { events: SecurityEvent[]; total: number; page: number; limit: number } {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.max(Number(params.limit) || 20, 1);
    let filtered = [...this.events];

    if (params.threatOnly) {
      filtered = filtered.filter(e => e.is_threat);
    }

    if (params.eventType && params.eventType !== 'ALL') {
      filtered = filtered.filter(e => e.event_type === params.eventType);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.source_ip.toLowerCase().includes(q) ||
          e.destination_ip.toLowerCase().includes(q) ||
          e.event_type.toLowerCase().includes(q) ||
          (e.user_id && e.user_id.toLowerCase().includes(q)) ||
          e.country.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return { events: paginated, total, page, limit };
  }

  public getEventById(id: string): SecurityEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  // Ingest security event & run full ML pipeline
  public ingestEvent(rawEvent: Partial<SecurityEvent>): { event: SecurityEvent; alert?: Alert } {
    const ipHistory = this.events.filter(e => e.source_ip === rawEvent.source_ip);
    const features = computeFeatures(rawEvent, ipHistory);
    const anomaly = isolationForest.predictAnomaly(features);
    const classification = threatClassifier.classify(rawEvent, features, anomaly);
    const risk = riskEngine.calculateRisk(features, anomaly, classification, rawEvent.event_type || 'NORMAL_TRAFFIC');

    const newId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const processedEvent: SecurityEvent = {
      id: newId,
      timestamp: rawEvent.timestamp || new Date().toISOString(),
      source_ip: rawEvent.source_ip || '192.168.1.100',
      destination_ip: rawEvent.destination_ip || '10.0.1.10',
      source_port: rawEvent.source_port || 50000 + Math.floor(Math.random() * 10000),
      destination_port: rawEvent.destination_port || 443,
      protocol: rawEvent.protocol || 'HTTPS',
      bytes_sent: rawEvent.bytes_sent || 1024,
      bytes_received: rawEvent.bytes_received || 2048,
      packet_count: rawEvent.packet_count || 12,
      duration_ms: rawEvent.duration_ms || 450,
      request_count: rawEvent.request_count || 1,
      failed_login_count: rawEvent.failed_login_count || 0,
      login_attempts: rawEvent.login_attempts || 0,
      user_id: rawEvent.user_id,
      device_id: rawEvent.device_id || 'srv-node-core',
      country: rawEvent.country || 'United States',
      country_code: rawEvent.country_code || 'US',
      lat: rawEvent.lat || 37.7749,
      lng: rawEvent.lng || -122.4194,
      authentication_status: rawEvent.authentication_status || 'NONE',
      event_type: classification.threat_type,
      response_code: rawEvent.response_code || 200,
      user_agent: rawEvent.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      anomaly_score: anomaly.anomaly_score,
      risk_score: risk.risk_score,
      is_threat: classification.is_threat || risk.risk_score >= 60,
    };

    let generatedAlert: Alert | undefined;

    // Trigger alert if threat or risk score >= 60
    if (processedEvent.is_threat || risk.risk_score >= 60) {
      const explanation = explainableAI.generateExplanation(
        processedEvent,
        features,
        anomaly,
        classification,
        risk.risk_score
      );

      const alertId = `AL-${1050 + this.alerts.length + 1}`;
      processedEvent.alert_id = alertId;

      generatedAlert = {
        id: alertId,
        title: this.formatAlertTitle(classification.threat_type, processedEvent.source_ip),
        timestamp: processedEvent.timestamp,
        severity: risk.severity,
        risk_score: risk.risk_score,
        status: 'NEW',
        threat_type: classification.threat_type,
        source_ip: processedEvent.source_ip,
        destination_ip: processedEvent.destination_ip,
        country: processedEvent.country,
        country_code: processedEvent.country_code,
        affected_user: processedEvent.user_id,
        affected_asset: processedEvent.device_id || 'perimeter-gateway',
        event_ids: [newId],
        event_count: 1,
        anomaly_score: anomaly.anomaly_score,
        confidence: classification.confidence,
        explanation,
        notes: [],
        containment_actions_taken: [],
      };

      this.alerts.unshift(generatedAlert);

      // Create notification
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `${risk.severity} Alert: ${generatedAlert.title}`,
        message: explanation.primary_factor,
        severity: risk.severity,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'THREAT_DETECTED',
        link_url: `/alerts`,
      });
    }

    this.events.unshift(processedEvent);
    return { event: processedEvent, alert: generatedAlert };
  }

  // Alerts
  public getAlerts(params: {
    severity?: string;
    status?: string;
    search?: string;
    threatType?: string;
  }): Alert[] {
    let filtered = [...this.alerts];

    if (params.severity && params.severity !== 'ALL') {
      filtered = filtered.filter(a => a.severity === params.severity);
    }
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter(a => a.status === params.status);
    }
    if (params.threatType && params.threatType !== 'ALL') {
      filtered = filtered.filter(a => a.threat_type === params.threatType);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.id.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.source_ip.toLowerCase().includes(q) ||
          a.destination_ip.toLowerCase().includes(q) ||
          (a.affected_user && a.affected_user.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return filtered;
  }

  public getAlertById(id: string): Alert | undefined {
    return this.alerts.find(a => a.id === id);
  }

  public updateAlert(id: string, updates: Partial<Alert>): Alert | undefined {
    const alertIndex = this.alerts.findIndex(a => a.id === id);
    if (alertIndex === -1) return undefined;

    const existing = this.alerts[alertIndex];
    const updated = { ...existing, ...updates };
    this.alerts[alertIndex] = updated;

    this.addAuditLog({
      user_email: 'analyst@sentinel.ai',
      user_role: 'ANALYST',
      action: 'ALERT_STATUS_UPDATE',
      resource: id,
      ip_address: '10.0.2.145',
      status: 'SUCCESS',
      details: `Updated alert ${id} status to ${updates.status || existing.status}`,
    });

    return updated;
  }

  public addAlertNote(id: string, noteText: string, author: string, role: string): Alert | undefined {
    const alert = this.getAlertById(id);
    if (!alert) return undefined;

    alert.notes.push({
      id: `note-${Date.now()}`,
      author,
      role,
      timestamp: new Date().toISOString(),
      text: noteText,
    });

    this.addAuditLog({
      user_email: author,
      user_role: (role as UserRole) || 'ANALYST',
      action: 'ALERT_NOTE_ADDED',
      resource: id,
      ip_address: '10.0.2.145',
      status: 'SUCCESS',
      details: `Added note to alert ${id}: "${noteText.slice(0, 40)}..."`,
    });

    return alert;
  }

  // Incidents
  public getIncidents(): Incident[] {
    return this.incidents.map(inc => {
      const linkedAlerts = this.alerts.filter(a => inc.alert_ids.includes(a.id));
      return { ...inc, alerts: linkedAlerts };
    });
  }

  public getIncidentById(id: string): Incident | undefined {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) return undefined;
    const linkedAlerts = this.alerts.filter(a => inc.alert_ids.includes(a.id));
    return { ...inc, alerts: linkedAlerts };
  }

  public createIncident(incidentData: {
    title: string;
    description: string;
    severity: Incident['severity'];
    alert_ids: string[];
    assigned_analyst: string;
  }): Incident {
    const newId = `INC-${8800 + this.incidents.length + 1}`;
    const linkedAlerts = this.alerts.filter(a => incidentData.alert_ids.includes(a.id));
    const avgRisk = linkedAlerts.length > 0
      ? Math.round(linkedAlerts.reduce((sum, a) => sum + a.risk_score, 0) / linkedAlerts.length)
      : 80;

    const tactics = Array.from(
      new Set(linkedAlerts.map(a => a.explanation?.mitre_technique?.tactic).filter(Boolean) as string[])
    );

    const newIncident: Incident = {
      id: newId,
      title: incidentData.title,
      description: incidentData.description,
      severity: incidentData.severity,
      status: 'OPEN',
      assigned_analyst: incidentData.assigned_analyst,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      alert_ids: incidentData.alert_ids,
      alerts: linkedAlerts,
      risk_score: avgRisk,
      mitre_tactics: tactics.length > 0 ? tactics : ['Credential Access', 'Defense Evasion'],
      recommendations: [
        'Perform subnet-wide network packet capture.',
        'Review cross-correlated logs on affected hosts.',
        'Execute automated host containment playbook.',
      ],
      timeline: [
        {
          timestamp: new Date().toISOString(),
          event: `Incident created with ${incidentData.alert_ids.length} linked alerts.`,
          actor: incidentData.assigned_analyst,
          type: 'ALERT_LINKED',
        },
      ],
      containment_status: {
        ip_blocked: false,
        credentials_reset: false,
        host_isolated: false,
        firewall_rule_applied: false,
      },
    };

    // Update alerts with incident_id
    for (const a of linkedAlerts) {
      a.incident_id = newId;
    }

    this.incidents.unshift(newIncident);

    this.addAuditLog({
      user_email: incidentData.assigned_analyst,
      user_role: 'ANALYST',
      action: 'INCIDENT_CREATED',
      resource: newId,
      ip_address: '10.0.2.145',
      status: 'SUCCESS',
      details: `Created incident ${newId} with ${incidentData.alert_ids.length} linked alerts.`,
    });

    return newIncident;
  }

  public updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const inc = this.getIncidentById(id);
    if (!inc) return undefined;

    Object.assign(inc, updates, { updated_at: new Date().toISOString() });

    this.addAuditLog({
      user_email: 'analyst@sentinel.ai',
      user_role: 'ANALYST',
      action: 'INCIDENT_UPDATED',
      resource: id,
      ip_address: '10.0.2.145',
      status: 'SUCCESS',
      details: `Updated incident ${id} details.`,
    });

    return inc;
  }

  // Dashboard summary metrics
  public getDashboardSummary(): DashboardSummary {
    const total_events = this.events.length;
    const threats_detected = this.events.filter(e => e.is_threat).length;
    const critical_alerts = this.alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
    const high_alerts = this.alerts.filter(a => a.severity === 'HIGH' && a.status !== 'RESOLVED').length;
    const medium_alerts = this.alerts.filter(a => a.severity === 'MEDIUM' && a.status !== 'RESOLVED').length;
    const low_alerts = this.alerts.filter(a => a.severity === 'LOW' && a.status !== 'RESOLVED').length;
    const active_incidents = this.incidents.filter(i => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length;

    const avg_risk_score = this.events.length > 0
      ? Math.round(this.events.reduce((sum, e) => sum + e.risk_score, 0) / this.events.length)
      : 24;

    return {
      total_events,
      threats_detected,
      critical_alerts,
      high_alerts,
      medium_alerts,
      low_alerts,
      active_incidents,
      avg_risk_score,
      detection_rate_pct: 97.4,
      false_positive_rate_pct: 1.2,
      events_per_second: 142.6,
      system_status: 'HEALTHY',
      components: [
        { name: 'API Gateway', status: 'HEALTHY', latency_ms: 12, uptime_pct: 99.98, details: 'Operating nominal' },
        { name: 'ML Inference Engine', status: 'HEALTHY', latency_ms: 3.8, uptime_pct: 99.99, details: 'Models v1.2.0 active' },
        { name: 'RAG Vector Store', status: 'HEALTHY', latency_ms: 15, uptime_pct: 100, details: '5 documents indexed' },
        { name: 'Real-time Event Streamer', status: 'HEALTHY', latency_ms: 5, uptime_pct: 99.95, details: 'SSE / WS broadcast active' },
        { name: 'PostgreSQL Relational DB', status: 'HEALTHY', latency_ms: 8, uptime_pct: 100, details: 'Storage nominal' },
      ],
    };
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  public markNotificationAsRead(id: string): void {
    const n = this.notifications.find(item => item.id === id);
    if (n) n.read = true;
  }

  public markAllNotificationsAsRead(): void {
    for (const n of this.notifications) n.read = true;
  }

  // Reset to full synthetic demo dataset
  public loadDemoDataset(): void {
    this.events = [...seedSecurityEvents];
    this.alerts = [...seedAlerts];
    this.incidents = [...seedIncidents];
    this.notifications = [...seedNotifications];
    this.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user_email: 'admin@sentinel.ai',
        user_role: 'ADMIN',
        action: 'LOG_DATASET_INGESTED',
        resource: 'Synthetic SOC Dataset',
        ip_address: '10.0.2.140',
        status: 'SUCCESS',
        details: 'Loaded comprehensive demo enterprise telemetry dataset (CICIDS2017 baseline + MITRE attack injections).',
      },
      ...seedAuditLogs,
    ];
  }

  private formatAlertTitle(threatType: EventType, ip: string): string {
    const map: Record<EventType, string> = {
      BRUTE_FORCE: `Rapid Authentication Brute Force from ${ip}`,
      DATA_EXFILTRATION: `High-Volume Egress Exfiltration Spike to ${ip}`,
      PORT_SCAN: `Perimeter Port Probing & Scan Sweep from ${ip}`,
      DDOS_BURST: `Volumetric Layer-7 Traffic Burst from ${ip}`,
      MALWARE_BEACON: `Command & Control Heartbeat Beaconing to ${ip}`,
      PRIVILEGE_ESCALATION: `Unauthorized Privilege Escalation Attempt from ${ip}`,
      SQL_INJECTION: `SQL Injection & Web Fuzzing Pattern from ${ip}`,
      API_ABUSE: `API Rate Limit Abuse & Parameter Fuzzing from ${ip}`,
      AUTH_FAILURE: `Repeated Authentication Failure Anomaly from ${ip}`,
      NORMAL_TRAFFIC: `Baseline Network Activity from ${ip}`,
    };
    return map[threatType] || `Security Threat Detected from ${ip}`;
  }
}

export const db = new SentinelDatabase();
