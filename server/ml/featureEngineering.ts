import { SecurityEvent } from '../../src/types';

export interface EngineeredFeatures {
  requests_per_minute: number;
  failed_login_ratio: number;
  auth_failure_rate: number;
  unique_destination_count: number;
  unique_port_count: number;
  session_duration_s: number;
  data_transfer_ratio: number;
  activity_frequency_score: number;
  time_of_day_deviation: number;
  historical_deviation: number;
  source_activity_score: number;
}

export function computeFeatures(
  event: Partial<SecurityEvent>,
  historicalEventsForIP: Partial<SecurityEvent>[] = []
): EngineeredFeatures {
  const durationSec = Math.max((event.duration_ms || 1000) / 1000, 0.1);
  const requests = event.request_count || 1;
  const requests_per_minute = (requests / durationSec) * 60;

  const totalLogins = (event.login_attempts || 0) + (event.failed_login_count || 0);
  const failedLogins = event.failed_login_count || 0;
  const failed_login_ratio = totalLogins > 0 ? failedLogins / totalLogins : (event.authentication_status === 'FAILED' ? 1.0 : 0.0);
  const auth_failure_rate = failedLogins > 0 ? Math.min(failedLogins / 5.0, 1.0) : 0.0;

  // History aggregation
  const recentHistory = historicalEventsForIP.slice(-20);
  const uniqueDests = new Set(recentHistory.map(e => e.destination_ip).filter(Boolean));
  if (event.destination_ip) uniqueDests.add(event.destination_ip);
  const unique_destination_count = Math.max(uniqueDests.size, 1);

  const uniquePorts = new Set(recentHistory.map(e => e.destination_port).filter(Boolean));
  if (event.destination_port) uniquePorts.add(event.destination_port);
  const unique_port_count = Math.max(uniquePorts.size, 1);

  const bytesSent = event.bytes_sent || 0;
  const bytesRecv = Math.max(event.bytes_received || 1, 1);
  const data_transfer_ratio = bytesSent / bytesRecv;

  const activity_frequency_score = Math.min(
    (requests_per_minute / 120) * 0.5 + (recentHistory.length / 10) * 0.5,
    1.0
  );

  // Time of day deviation: assuming standard business hours 08:00 - 18:00
  let time_of_day_deviation = 0.1;
  if (event.timestamp) {
    try {
      const hour = new Date(event.timestamp).getUTCHours();
      if (hour < 6 || hour > 21) {
        time_of_day_deviation = 0.85; // Late night anomaly
      } else if (hour < 8 || hour > 18) {
        time_of_day_deviation = 0.45;
      }
    } catch {
      time_of_day_deviation = 0.2;
    }
  }

  const baselineBytes = 1500;
  const historical_deviation = Math.min(Math.abs(bytesSent - baselineBytes) / 10000, 1.0);

  const source_activity_score = Math.min(
    (unique_port_count > 5 ? 0.4 : 0.0) +
    (failed_login_ratio > 0.5 ? 0.35 : 0.0) +
    (requests_per_minute > 200 ? 0.25 : 0.0),
    1.0
  );

  return {
    requests_per_minute,
    failed_login_ratio,
    auth_failure_rate,
    unique_destination_count,
    unique_port_count,
    session_duration_s: durationSec,
    data_transfer_ratio,
    activity_frequency_score,
    time_of_day_deviation,
    historical_deviation,
    source_activity_score,
  };
}
