export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  lastLogin: string;
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';

export type EventType =
  | 'AUTH_FAILURE'
  | 'BRUTE_FORCE'
  | 'PORT_SCAN'
  | 'DATA_EXFILTRATION'
  | 'DDOS_BURST'
  | 'MALWARE_BEACON'
  | 'PRIVILEGE_ESCALATION'
  | 'API_ABUSE'
  | 'SQL_INJECTION'
  | 'NORMAL_TRAFFIC';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  source_port: number;
  destination_port: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS' | 'SSH' | 'DNS';
  bytes_sent: number;
  bytes_received: number;
  packet_count: number;
  duration_ms: number;
  request_count: number;
  failed_login_count: number;
  login_attempts: number;
  user_id?: string;
  device_id?: string;
  country: string;
  country_code: string;
  lat?: number;
  lng?: number;
  authentication_status: 'SUCCESS' | 'FAILED' | 'CHALLENGED' | 'NONE';
  event_type: EventType;
  response_code: number;
  user_agent: string;
  anomaly_score: number; // 0.0 to 1.0
  risk_score: number; // 0 to 100
  is_threat: boolean;
  alert_id?: string;
}

export interface ExplainableAIData {
  confidence: number;
  primary_factor: string;
  contributing_factors: {
    feature: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    deviation_vs_baseline: string;
  }[];
  mitre_technique?: {
    id: string;
    name: string;
    tactic: string;
    url: string;
  };
  recommended_defensive_actions: string[];
}

export interface AlertNote {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  text: string;
}

export interface Alert {
  id: string; // e.g. AL-1042
  title: string;
  timestamp: string;
  severity: Severity;
  risk_score: number;
  status: AlertStatus;
  threat_type: EventType;
  source_ip: string;
  destination_ip: string;
  country: string;
  country_code: string;
  affected_user?: string;
  affected_asset: string;
  event_ids: string[];
  event_count: number;
  anomaly_score: number;
  confidence: number;
  explanation: ExplainableAIData;
  incident_id?: string;
  assigned_analyst?: string;
  notes: AlertNote[];
  containment_actions_taken: string[];
}

export interface Incident {
  id: string; // e.g. INC-8802
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  assigned_analyst: string;
  created_at: string;
  updated_at: string;
  alert_ids: string[];
  alerts: Alert[];
  risk_score: number;
  mitre_tactics: string[];
  ai_summary?: string;
  recommendations: string[];
  timeline: {
    timestamp: string;
    event: string;
    actor: string;
    type: 'ALERT_LINKED' | 'STATUS_CHANGE' | 'ANALYST_NOTE' | 'CONTAINMENT_ACTION' | 'AI_TRIAGE';
  }[];
  containment_status: {
    ip_blocked: boolean;
    credentials_reset: boolean;
    host_isolated: boolean;
    firewall_rule_applied: boolean;
  };
}

export interface ModelMetric {
  id: string;
  name: string;
  version: string;
  type: 'ISOLATION_FOREST' | 'RANDOM_FOREST' | 'XGBOOST_ENSEMBLE';
  status: 'PRODUCTION' | 'TESTING' | 'ARCHIVED';
  trained_at: string;
  dataset_name: string;
  training_sample_count: number;
  feature_count: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  false_positive_rate: number;
  inference_latency_ms: number;
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  feature_importance: {
    feature: string;
    importance: number;
    description: string;
  }[];
}

export interface RAGDocument {
  id: string;
  title: string;
  category: 'POLICY' | 'INCIDENT_RESPONSE' | 'NIST_FRAMEWORK' | 'OWASP' | 'SOP' | 'USER_UPLOAD';
  file_type: 'PDF' | 'TXT' | 'MARKDOWN';
  file_size_kb: number;
  uploaded_at: string;
  uploaded_by: string;
  status: 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  chunk_count: number;
  vector_dimensions: number;
  snippet: string;
  chunks?: {
    id: string;
    chunk_index: number;
    content: string;
    token_count: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: {
    document_title: string;
    category: string;
    snippet: string;
    similarity_score: number;
  }[];
  referenced_alerts?: string[];
  referenced_incidents?: string[];
  is_live_db_query?: boolean;
  confidence?: number;
  evidence?: string[];
  defensive_actions?: string[];
  query_category?: 'LIVE_METRICS' | 'THREAT_INVESTIGATION' | 'KNOWLEDGE_RETRIEVAL' | 'GENERAL_DEFENSE';
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  context?: {
    alert_id?: string;
    incident_id?: string;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string;
  user_role: UserRole;
  action:
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'FAILED_LOGIN'
    | 'ALERT_STATUS_UPDATE'
    | 'ALERT_NOTE_ADDED'
    | 'INCIDENT_CREATED'
    | 'INCIDENT_UPDATED'
    | 'CONTAINMENT_EXECUTED'
    | 'LOG_DATASET_INGESTED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_DELETED'
    | 'COPILOT_QUERY'
    | 'MODEL_CONFIG_CHANGE'
    | 'DATA_EXPORTED';
  resource: string;
  ip_address: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details: string;
}

export interface SystemComponentHealth {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  latency_ms: number;
  uptime_pct: number;
  details: string;
}

export interface DashboardSummary {
  total_events: number;
  threats_detected: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  active_incidents: number;
  avg_risk_score: number;
  detection_rate_pct: number;
  false_positive_rate_pct: number;
  events_per_second: number;
  system_status: 'HEALTHY' | 'DEGRADED' | 'WARNING';
  components: SystemComponentHealth[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  timestamp: string;
  read: boolean;
  type: 'THREAT_DETECTED' | 'INCIDENT_ESCALATED' | 'MODEL_DRIFT' | 'DATASET_INDEXED' | 'SYSTEM_ALERT';
  link_url?: string;
}
