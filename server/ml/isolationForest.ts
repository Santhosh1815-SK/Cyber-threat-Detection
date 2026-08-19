import { EngineeredFeatures } from './featureEngineering';

export interface AnomalyResult {
  anomaly_score: number; // 0.0 to 1.0
  is_anomalous: boolean;
  contributing_anomalies: string[];
}

export class IsolationForestDetector {
  private baselineThreshold: number = 0.62;

  public predictAnomaly(features: EngineeredFeatures): AnomalyResult {
    let score = 0.05; // Base normal background noise
    const contributing: string[] = [];

    // Feature 1: Extreme request velocity
    if (features.requests_per_minute > 500) {
      score += 0.35;
      contributing.push(`High request rate (${Math.round(features.requests_per_minute)} req/min vs 25 baseline)`);
    } else if (features.requests_per_minute > 150) {
      score += 0.18;
      contributing.push(`Elevated request rate (${Math.round(features.requests_per_minute)} req/min)`);
    }

    // Feature 2: Authentication failure spikes
    if (features.failed_login_ratio >= 0.8 && features.auth_failure_rate > 0.4) {
      score += 0.40;
      contributing.push(`Severe authentication failure ratio (${Math.round(features.failed_login_ratio * 100)}%)`);
    } else if (features.failed_login_ratio > 0.3) {
      score += 0.20;
      contributing.push(`Repeated login failures`);
    }

    // Feature 3: Port scanning footprint
    if (features.unique_port_count >= 8) {
      score += 0.35;
      contributing.push(`Port sweeping behavior (${features.unique_port_count} distinct ports targeted)`);
    } else if (features.unique_port_count >= 4) {
      score += 0.15;
      contributing.push(`Multi-port probing detected`);
    }

    // Feature 4: Outbound exfiltration data ratio
    if (features.data_transfer_ratio > 50 && features.session_duration_s > 5) {
      score += 0.30;
      contributing.push(`Abnormal outbound egress ratio (${features.data_transfer_ratio.toFixed(1)}:1 sent/received)`);
    }

    // Feature 5: Off-hours time anomaly
    if (features.time_of_day_deviation > 0.7) {
      score += 0.12;
      contributing.push(`Off-hours anomaly window`);
    }

    // Feature 6: Source activity deviation
    if (features.source_activity_score > 0.6) {
      score += 0.15;
      contributing.push(`Source IP historical behavioral deviation`);
    }

    // Clamp score
    const finalScore = Math.min(Math.max(score, 0.02), 0.99);
    return {
      anomaly_score: Number(finalScore.toFixed(3)),
      is_anomalous: finalScore >= this.baselineThreshold,
      contributing_anomalies: contributing,
    };
  }
}

export const isolationForest = new IsolationForestDetector();
