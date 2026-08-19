import { EventType, ExplainableAIData, SecurityEvent } from '../../src/types';
import { EngineeredFeatures } from './featureEngineering';
import { AnomalyResult } from './isolationForest';
import { ClassificationResult } from './threatClassifier';

export class ExplainableAIService {
  public generateExplanation(
    event: Partial<SecurityEvent>,
    features: EngineeredFeatures,
    anomaly: AnomalyResult,
    classification: ClassificationResult,
    riskScore: number
  ): ExplainableAIData {
    const contributing: ExplainableAIData['contributing_factors'] = [];

    // Feature 1: Login failures
    if ((event.failed_login_count || 0) > 0 || features.failed_login_ratio > 0.3) {
      contributing.push({
        feature: 'Failed Authentication Velocity',
        description: `${event.failed_login_count || 0} failed login attempts recorded in rapid sequence.`,
        impact: (event.failed_login_count || 0) > 5 ? 'HIGH' : 'MEDIUM',
        deviation_vs_baseline: `+${((features.failed_login_ratio - 0.05) * 100).toFixed(0)}% vs baseline 5%`,
      });
    }

    // Feature 2: Port scanning
    if (features.unique_port_count >= 3) {
      contributing.push({
        feature: 'Multi-Port Probing Spread',
        description: `Source contacted ${features.unique_port_count} non-standard ports within a 60-second window.`,
        impact: features.unique_port_count >= 6 ? 'HIGH' : 'MEDIUM',
        deviation_vs_baseline: `${features.unique_port_count} ports vs baseline 1.2 ports`,
      });
    }

    // Feature 3: Request rate
    if (features.requests_per_minute > 100) {
      contributing.push({
        feature: 'Request Throughput Anomaly',
        description: `Traffic frequency reached ${Math.round(features.requests_per_minute)} requests/min.`,
        impact: features.requests_per_minute > 300 ? 'HIGH' : 'MEDIUM',
        deviation_vs_baseline: `+${Math.round(features.requests_per_minute - 25)} req/min above baseline`,
      });
    }

    // Feature 4: Outbound transfer
    if ((event.bytes_sent || 0) > 1000000 || features.data_transfer_ratio > 10) {
      contributing.push({
        feature: 'Outbound Egress Volume',
        description: `Transmitted ${((event.bytes_sent || 0) / 1024 / 1024).toFixed(2)} MB outbound over single channel.`,
        impact: (event.bytes_sent || 0) > 10000000 ? 'HIGH' : 'MEDIUM',
        deviation_vs_baseline: `${features.data_transfer_ratio.toFixed(1)}:1 sent/received ratio`,
      });
    }

    // Feature 5: Time of day
    if (features.time_of_day_deviation > 0.6) {
      contributing.push({
        feature: 'Temporal / Off-Hours Anomaly',
        description: 'Activity detected outside standard operational schedule (UTC 00:00 - 05:00).',
        impact: 'LOW',
        deviation_vs_baseline: 'Significant deviation from normal circadian active hours',
      });
    }

    if (contributing.length === 0) {
      contributing.push({
        feature: 'Statistical Baseline Comparison',
        description: 'Behavior matches established network traffic baseline profiles.',
        impact: 'LOW',
        deviation_vs_baseline: '0% anomaly deviation',
      });
    }

    // Primary factor
    const primaryFactor = contributing[0]?.description || 'Multi-variate statistical anomaly detected by Isolation Forest.';

    // MITRE ATT&CK mapping
    const mitreMapping: Record<EventType, { id: string; name: string; tactic: string; url: string }> = {
      BRUTE_FORCE: {
        id: 'T1110.001',
        name: 'Password Guessing',
        tactic: 'Credential Access',
        url: 'https://attack.mitre.org/techniques/T1110/001/',
      },
      PORT_SCAN: {
        id: 'T1046',
        name: 'Network Service Scanning',
        tactic: 'Discovery',
        url: 'https://attack.mitre.org/techniques/T1046/',
      },
      DATA_EXFILTRATION: {
        id: 'T1048.003',
        name: 'Exfiltration Over Unencrypted Non-C2 Protocol',
        tactic: 'Exfiltration',
        url: 'https://attack.mitre.org/techniques/T1048/003/',
      },
      DDOS_BURST: {
        id: 'T1498.001',
        name: 'Direct Network Flood',
        tactic: 'Impact',
        url: 'https://attack.mitre.org/techniques/T1498/001/',
      },
      MALWARE_BEACON: {
        id: 'T1071.001',
        name: 'Web Protocols Command and Control',
        tactic: 'Command and Control',
        url: 'https://attack.mitre.org/techniques/T1071/001/',
      },
      PRIVILEGE_ESCALATION: {
        id: 'T1068',
        name: 'Exploitation for Privilege Escalation',
        tactic: 'Privilege Escalation',
        url: 'https://attack.mitre.org/techniques/T1068/',
      },
      API_ABUSE: {
        id: 'T1190',
        name: 'Exploit Public-Facing Application',
        tactic: 'Initial Access',
        url: 'https://attack.mitre.org/techniques/T1190/',
      },
      SQL_INJECTION: {
        id: 'T1190',
        name: 'SQL Injection on Web Entrypoint',
        tactic: 'Initial Access',
        url: 'https://attack.mitre.org/techniques/T1190/',
      },
      AUTH_FAILURE: {
        id: 'T1078.003',
        name: 'Local Accounts Validation Anomaly',
        tactic: 'Defense Evasion',
        url: 'https://attack.mitre.org/techniques/T1078/003/',
      },
      NORMAL_TRAFFIC: {
        id: 'T0000',
        name: 'Standard Baseline Protocol',
        tactic: 'Benign',
        url: 'https://attack.mitre.org/',
      },
    };

    // Recommended defensive actions
    const recommendations: Record<EventType, string[]> = {
      BRUTE_FORCE: [
        'Temporarily throttle / rate-limit authentication attempts from source IP.',
        'Enforce mandatory Multi-Factor Authentication (MFA) step-up for targeted user account.',
        'Review Active Directory / IdP authentication failure event IDs (4625).',
        'Verify if any password sprayed combinations succeeded.',
      ],
      PORT_SCAN: [
        'Block source IP at perimeter firewall or Cloud WAF security group.',
        'Inspect exposed ports on destination host and close unnecessary listening services.',
        'Verify host IDS/IPS rules are triggering auto-drop on SYN sweep sequences.',
      ],
      DATA_EXFILTRATION: [
        'Isolate target host immediately from the local subnet to prevent lateral staging.',
        'Inspect network egress proxy logs to determine payload hashes and file metadata.',
        'Revoke session tokens and rotate service account credentials associated with host.',
        'Trigger forensic memory image capture for artifact analysis.',
      ],
      DDOS_BURST: [
        'Enable Cloudflare / AWS Shield rate limiting and challenge mitigation.',
        'Drop malicious traffic signatures at edge CDN layer before hitting origin server.',
        'Scale origin auto-scaling groups and activate SYN proxy cookies.',
      ],
      MALWARE_BEACON: [
        'Quarantine affected endpoint using EDR agent containment action.',
        'Add destination C2 IP/domain to enterprise DNS sinkhole list.',
        'Extract and inspect process trees communicating on the destination socket.',
      ],
      PRIVILEGE_ESCALATION: [
        'Immediately disable affected user account and invalidate all active session cookies.',
        'Audit sudoers configuration and Linux auditd / Windows Security Event logs (Event 4672).',
        'Review recent cron jobs, systemd services, and SUID binary modifications.',
      ],
      API_ABUSE: [
        'Implement IP-based token bucket rate limiter on the endpoint.',
        'Require HMAC request signature headers or OAuth 2.0 client credentials.',
        'Block user-agent pattern at API Gateway level.',
      ],
      SQL_INJECTION: [
        'Verify backend ORM parameterization and sanitize database query inputs.',
        'Enable WAF OWASP SQLi inspection rules with blocking mode.',
        'Audit database audit logs for unauthorized schema extraction queries.',
      ],
      AUTH_FAILURE: [
        'Verify whether legitimate user forgot credentials or identity is compromised.',
        'Trigger password reset notification to user via secondary out-of-band channel.',
      ],
      NORMAL_TRAFFIC: ['No immediate defensive intervention required.'],
    };

    return {
      confidence: classification.confidence,
      primary_factor: primaryFactor,
      contributing_factors: contributing,
      mitre_technique: mitreMapping[classification.threat_type] || mitreMapping.NORMAL_TRAFFIC,
      recommended_defensive_actions: recommendations[classification.threat_type] || recommendations.NORMAL_TRAFFIC,
    };
  }
}

export const explainableAI = new ExplainableAIService();
