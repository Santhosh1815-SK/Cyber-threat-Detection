import { EventType, Severity } from '../../src/types';
import { EngineeredFeatures } from './featureEngineering';
import { AnomalyResult } from './isolationForest';
import { ClassificationResult } from './threatClassifier';

export interface RiskResult {
  risk_score: number; // 0 to 100
  severity: Severity;
  risk_factors: { factor: string; score_contribution: number }[];
}

export class RiskEngine {
  public calculateRisk(
    features: EngineeredFeatures,
    anomaly: AnomalyResult,
    classification: ClassificationResult,
    rawEventType: EventType
  ): RiskResult {
    let score = 0;
    const factors: { factor: string; score_contribution: number }[] = [];

    if (!classification.is_threat && !anomaly.is_anomalous) {
      return {
        risk_score: Math.min(Math.round(anomaly.anomaly_score * 20), 22),
        severity: 'LOW',
        risk_factors: [{ factor: 'Normal traffic activity within baseline limits', score_contribution: 5 }],
      };
    }

    // 1. Base threat severity weighting
    const threatWeights: Record<EventType, number> = {
      BRUTE_FORCE: 78,
      DATA_EXFILTRATION: 92,
      DDOS_BURST: 85,
      MALWARE_BEACON: 88,
      PRIVILEGE_ESCALATION: 94,
      SQL_INJECTION: 90,
      PORT_SCAN: 68,
      AUTH_FAILURE: 55,
      API_ABUSE: 62,
      NORMAL_TRAFFIC: 10,
    };

    const baseWeight = threatWeights[classification.threat_type] || 50;
    score += baseWeight * 0.45;
    factors.push({
      factor: `Base Threat Signature (${classification.threat_type})`,
      score_contribution: Math.round(baseWeight * 0.45),
    });

    // 2. ML Anomaly Score contribution (0-25)
    const anomalyPoints = Math.round(anomaly.anomaly_score * 25);
    score += anomalyPoints;
    factors.push({
      factor: `ML Anomaly Confidence (${(anomaly.anomaly_score * 100).toFixed(0)}%)`,
      score_contribution: anomalyPoints,
    });

    // 3. Failed Logins & Auth impact (0-15)
    if (features.failed_login_ratio > 0.5) {
      const authPts = Math.min(Math.round(features.failed_login_ratio * 15), 15);
      score += authPts;
      factors.push({
        factor: `High Authentication Failure Rate (${(features.failed_login_ratio * 100).toFixed(0)}%)`,
        score_contribution: authPts,
      });
    }

    // 4. Volume / Egress velocity (0-10)
    if (features.requests_per_minute > 200 || features.data_transfer_ratio > 25) {
      const volPts = 10;
      score += volPts;
      factors.push({
        factor: 'Volumetric Egress / Velocity Spike',
        score_contribution: volPts,
      });
    }

    // 5. Off-hours timing (0-5)
    if (features.time_of_day_deviation > 0.7) {
      score += 5;
      factors.push({
        factor: 'Off-hours Execution Window',
        score_contribution: 5,
      });
    }

    // Clamp score 0 - 100
    const finalRisk = Math.min(Math.max(Math.round(score), 10), 100);

    let severity: Severity = 'LOW';
    if (finalRisk >= 80) severity = 'CRITICAL';
    else if (finalRisk >= 60) severity = 'HIGH';
    else if (finalRisk >= 30) severity = 'MEDIUM';
    else severity = 'LOW';

    return {
      risk_score: finalRisk,
      severity,
      risk_factors: factors,
    };
  }
}

export const riskEngine = new RiskEngine();
