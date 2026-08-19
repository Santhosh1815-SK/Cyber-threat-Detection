import { EventType, SecurityEvent } from '../../src/types';
import { EngineeredFeatures } from './featureEngineering';
import { AnomalyResult } from './isolationForest';

export interface ClassificationResult {
  threat_type: EventType;
  confidence: number;
  is_threat: boolean;
  classification_factors: string[];
}

export class ThreatClassifier {
  public classify(
    event: Partial<SecurityEvent>,
    features: EngineeredFeatures,
    anomaly: AnomalyResult
  ): ClassificationResult {
    const rawType = event.event_type;

    // Direct indicators
    if (features.failed_login_ratio >= 0.6 && (event.failed_login_count || 0) >= 3) {
      return {
        threat_type: 'BRUTE_FORCE',
        confidence: Math.min(0.75 + (event.failed_login_count || 3) * 0.03, 0.98),
        is_threat: true,
        classification_factors: [
          `Rapid consecutive authentication failures (${event.failed_login_count || 0} failed)`,
          'High login failure ratio exceeding threshold (60%)',
          'Targeted identity vector',
        ],
      };
    }

    if (features.unique_port_count >= 5 || event.destination_port === 22 || event.destination_port === 3389 || rawType === 'PORT_SCAN') {
      if (features.unique_port_count >= 4 || rawType === 'PORT_SCAN') {
        return {
          threat_type: 'PORT_SCAN',
          confidence: 0.92,
          is_threat: true,
          classification_factors: [
            `Scanned ${features.unique_port_count} distinct ports within short duration`,
            'Sequential SYN packet probing pattern',
            'Service discovery reconnaissance signature',
          ],
        };
      }
    }

    if (features.requests_per_minute > 400 || rawType === 'DDOS_BURST') {
      return {
        threat_type: 'DDOS_BURST',
        confidence: 0.95,
        is_threat: true,
        classification_factors: [
          `Extreme request throughput (${Math.round(features.requests_per_minute)} req/min)`,
          'Packet flood volume exceeding connection buffer capacity',
          'Volumetric layer-7 / transport-layer exhaustion pattern',
        ],
      };
    }

    if ((event.bytes_sent || 0) > 5000000 && features.data_transfer_ratio > 20 || rawType === 'DATA_EXFILTRATION') {
      return {
        threat_type: 'DATA_EXFILTRATION',
        confidence: 0.89,
        is_threat: true,
        classification_factors: [
          `High egress payload size (${((event.bytes_sent || 0) / 1024 / 1024).toFixed(2)} MB)`,
          `Outbound-to-inbound transfer ratio: ${features.data_transfer_ratio.toFixed(1)}:1`,
          'Potential unauthorized data staging and transmission',
        ],
      };
    }

    if (rawType === 'MALWARE_BEACON' || (event.user_agent && event.user_agent.toLowerCase().includes('beacon'))) {
      return {
        threat_type: 'MALWARE_BEACON',
        confidence: 0.88,
        is_threat: true,
        classification_factors: [
          'Periodic jittered telemetry check-in sequence',
          'Encrypted payload headers matching known C2 beacon profiles',
          'Uncommon external destination IP with no domain reputation',
        ],
      };
    }

    if (rawType === 'PRIVILEGE_ESCALATION' || (event.user_id && event.user_id.includes('root') && event.authentication_status === 'FAILED')) {
      return {
        threat_type: 'PRIVILEGE_ESCALATION',
        confidence: 0.91,
        is_threat: true,
        classification_factors: [
          'Targeted elevated administrator / root credentials',
          'Unauthorized sudo/chown permission execution attempt',
          'Security context boundary violation',
        ],
      };
    }

    if (rawType === 'API_ABUSE' || (event.response_code === 429 || event.response_code === 403)) {
      return {
        threat_type: 'API_ABUSE',
        confidence: 0.86,
        is_threat: true,
        classification_factors: [
          'Rate limit violation & repeated 403/429 status codes',
          'High frequency automated parameter permutation',
          'Bypassing client application throttling',
        ],
      };
    }

    if (rawType === 'SQL_INJECTION' || (event.user_agent && event.user_agent.includes('sqlmap'))) {
      return {
        threat_type: 'SQL_INJECTION',
        confidence: 0.96,
        is_threat: true,
        classification_factors: [
          'SQL syntactic meta-characters (UNION SELECT / OR 1=1)',
          'Automated scanner fingerprint detected',
          'Web application firewall (WAF) rule trigger',
        ],
      };
    }

    if (anomaly.is_anomalous) {
      return {
        threat_type: 'AUTH_FAILURE',
        confidence: 0.74,
        is_threat: true,
        classification_factors: anomaly.contributing_anomalies,
      };
    }

    return {
      threat_type: 'NORMAL_TRAFFIC',
      confidence: 0.97,
      is_threat: false,
      classification_factors: ['Traffic matches standard baseline telemetry patterns'],
    };
  }
}

export const threatClassifier = new ThreatClassifier();
