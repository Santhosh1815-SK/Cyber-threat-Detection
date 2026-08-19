import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database';
import { vectorStore } from '../rag/vectorStore';
import { ChatMessage } from '../../src/types';

export interface CopilotQueryRequest {
  message: string;
  context?: {
    alert_id?: string;
    incident_id?: string;
  };
  userRole?: string;
}

export interface CopilotResponse {
  answer: string;
  sources: {
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

export class SentinelCopilotService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  public async ask(request: CopilotQueryRequest): Promise<CopilotResponse> {
    const query = request.message.trim();
    const queryLower = query.toLowerCase();

    // 1. Check for offensive prompt injection / malicious usage attempt (Defensive Guardrails)
    if (this.isOffensiveRequest(queryLower)) {
      return {
        answer: `**Sentinel AI Defensive Guardrail Triggered:**\n\nI am configured strictly as a defensive Security Operations Center (SOC) intelligence system. I cannot assist with exploit development, malware payload generation, brute force attack scripts, unauthorized credential extraction, or intrusive scanning.\n\n**Recommended Defensive Focus:**\n- We can investigate how to detect this threat signature within your environment.\n- We can review NIST/OWASP mitigation guidelines and WAF/firewall hardening rules.\n- Would you like me to inspect your active alerts or review incident response playbooks for this vector?`,
        sources: [],
        query_category: 'GENERAL_DEFENSE',
        confidence: 1.0,
      };
    }

    // 2. Determine Context & Grounding
    let targetedAlert = request.context?.alert_id ? db.getAlertById(request.context.alert_id) : undefined;
    let targetedIncident = request.context?.incident_id ? db.getIncidentById(request.context.incident_id) : undefined;

    // Check if query references an alert ID like AL-1042 or AL 1042
    const alertIdMatch = query.match(/AL-?\d{4}/i);
    if (!targetedAlert && alertIdMatch) {
      const parsedId = alertIdMatch[0].toUpperCase().replace('AL', 'AL-');
      targetedAlert = db.getAlertById(parsedId);
    }

    // Check if query references an incident ID like INC-8801
    const incIdMatch = query.match(/INC-?\d{4}/i);
    if (!targetedIncident && incIdMatch) {
      const parsedId = incIdMatch[0].toUpperCase().replace('INC', 'INC-');
      targetedIncident = db.getIncidentById(parsedId);
    }

    // 3. RAG Retrieval from Vector Store
    const ragResults = vectorStore.search(query, 3);
    const sources = ragResults.map(r => ({
      document_title: r.document_title,
      category: r.category,
      snippet: r.content.slice(0, 240) + '...',
      similarity_score: r.similarity_score,
    }));

    // 4. Live Platform State Grounding
    const summary = db.getDashboardSummary();
    const activeAlerts = db.getAlerts({ status: 'ALL' });
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL');
    const recentIncidents = db.getIncidents();

    const isLiveQuery =
      queryLower.includes('today') ||
      queryLower.includes('critical') ||
      queryLower.includes('how many') ||
      queryLower.includes('alert') ||
      queryLower.includes('incident') ||
      queryLower.includes('highest') ||
      queryLower.includes('summary') ||
      queryLower.includes('status') ||
      !!targetedAlert ||
      !!targetedIncident;

    // 5. If Gemini API is available, generate model response
    if (this.ai) {
      try {
        const prompt = this.buildPrompt({
          query,
          summary,
          criticalAlerts,
          recentIncidents,
          targetedAlert,
          targetedIncident,
          ragResults,
          userRole: request.userRole || 'ANALYST',
        });

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are Sentinel Copilot, a senior Tier-3 AI Cybersecurity & SOC Analyst.
You assist security engineers in investigating alerts, correlating threats, interpreting ML anomaly scores, and formulating defensive containment actions according to NIST SP 800-61 and MITRE ATT&CK.
RULES:
1. Speak with professional, evidence-based composure.
2. If citing live alerts or incidents, use their exact IDs (e.g. AL-1042, INC-8801).
3. If citing knowledge documents, reference the NIST/OWASP guidance accurately.
4. Format output cleanly in Markdown with bold key facts, bullet points, and actionable defensive checklists.
5. Strictly defensive only. Never output exploit code or attack instructions.`,
            temperature: 0.2,
          },
        });

        const textOutput = response.text || 'Analysis completed successfully.';
        return {
          answer: textOutput,
          sources,
          referenced_alerts: targetedAlert ? [targetedAlert.id] : criticalAlerts.slice(0, 3).map(a => a.id),
          referenced_incidents: targetedIncident ? [targetedIncident.id] : recentIncidents.slice(0, 2).map(i => i.id),
          is_live_db_query: isLiveQuery,
          confidence: 0.96,
          query_category: targetedAlert || targetedIncident ? 'THREAT_INVESTIGATION' : isLiveQuery ? 'LIVE_METRICS' : 'KNOWLEDGE_RETRIEVAL',
        };
      } catch (err: any) {
        console.error('Gemini API call failed, falling back to local defensive rule engine:', err);
      }
    }

    // 6. Deterministic Local Rule Engine fallback (Provides full functionality even offline/without key)
    return this.generateDeterministicResponse(
      query,
      targetedAlert,
      targetedIncident,
      summary,
      criticalAlerts,
      recentIncidents,
      sources
    );
  }

  private isOffensiveRequest(q: string): boolean {
    const prohibited = [
      'create malware',
      'write a virus',
      'ddos attack script',
      'steal password',
      'crack password',
      'exploit vulnerability',
      'sql injection payload to hack',
      'bypass authorization illegally',
      'port scan unauthorized',
      'reverse shell payload',
    ];
    return prohibited.some(term => q.includes(term));
  }

  private buildPrompt(params: any): string {
    const { query, summary, criticalAlerts, recentIncidents, targetedAlert, targetedIncident, ragResults, userRole } = params;

    let contextText = `User Role: ${userRole}\n`;
    contextText += `LIVE SOC SYSTEM STATE:\n`;
    contextText += `- Total Ingested Events: ${summary.total_events}\n`;
    contextText += `- Threats Detected: ${summary.threats_detected}\n`;
    contextText += `- Critical Active Alerts: ${summary.critical_alerts}\n`;
    contextText += `- Active Incidents: ${summary.active_incidents}\n`;
    contextText += `- System Health: ${summary.system_status}\n\n`;

    if (targetedAlert) {
      contextText += `ACTIVE ALERT IN CONTEXT:\n`;
      contextText += `- Alert ID: ${targetedAlert.id} (${targetedAlert.title})\n`;
      contextText += `- Severity: ${targetedAlert.severity} | Risk Score: ${targetedAlert.risk_score}/100 | ML Confidence: ${(targetedAlert.confidence * 100).toFixed(0)}%\n`;
      contextText += `- Threat Type: ${targetedAlert.threat_type}\n`;
      contextText += `- Source IP: ${targetedAlert.source_ip} (${targetedAlert.country})\n`;
      contextText += `- Destination IP: ${targetedAlert.destination_ip} (Asset: ${targetedAlert.affected_asset})\n`;
      contextText += `- Explanation: ${targetedAlert.explanation.primary_factor}\n`;
      contextText += `- MITRE Technique: ${targetedAlert.explanation.mitre_technique?.id} ${targetedAlert.explanation.mitre_technique?.name}\n`;
      contextText += `- Recommended Actions: ${targetedAlert.explanation.recommended_defensive_actions.join('; ')}\n\n`;
    }

    if (targetedIncident) {
      contextText += `ACTIVE INCIDENT IN CONTEXT:\n`;
      contextText += `- Incident ID: ${targetedIncident.id} (${targetedIncident.title})\n`;
      contextText += `- Status: ${targetedIncident.status} | Severity: ${targetedIncident.severity} | Risk: ${targetedIncident.risk_score}/100\n`;
      contextText += `- Linked Alerts: ${targetedIncident.alert_ids.join(', ')}\n`;
      contextText += `- Summary: ${targetedIncident.ai_summary}\n\n`;
    }

    if (ragResults && ragResults.length > 0) {
      contextText += `RETRIEVED KNOWLEDGE BASE GUIDANCE:\n`;
      for (const r of ragResults) {
        contextText += `[${r.document_title} - ${r.category}]:\n${r.content}\n\n`;
      }
    }

    return `${contextText}\n\nUSER QUESTION: "${query}"\nProvide a comprehensive, accurate, and security-grounded response.`;
  }

  private generateDeterministicResponse(
    query: string,
    targetedAlert: any,
    targetedIncident: any,
    summary: any,
    criticalAlerts: any[],
    recentIncidents: any[],
    sources: any[]
  ): CopilotResponse {
    const q = query.toLowerCase();

    // Specific alert investigation
    if (targetedAlert) {
      return {
        answer: `### Security Investigation for Alert **${targetedAlert.id}**

**Threat Assessment:**
- **Classification:** \`${targetedAlert.threat_type}\`
- **Severity & Risk:** **${targetedAlert.severity}** (Risk Score: **${targetedAlert.risk_score}/100**, Confidence: **${Math.round(targetedAlert.confidence * 100)}%**)
- **Adversary Source:** \`${targetedAlert.source_ip}\` (${targetedAlert.country})
- **Target Asset:** \`${targetedAlert.affected_asset}\` (\`${targetedAlert.destination_ip}\`)

**Why was this detected? (Explainable AI)**
${targetedAlert.explanation.primary_factor}
${targetedAlert.explanation.contributing_factors.map((f: any) => `• **${f.feature}:** ${f.description} *(${f.deviation_vs_baseline})*`).join('\n')}

**MITRE ATT&CK Mapping:**
- **Technique:** \`${targetedAlert.explanation.mitre_technique?.id}\` — **${targetedAlert.explanation.mitre_technique?.name}** (*${targetedAlert.explanation.mitre_technique?.tactic}*)

**Recommended Defensive Actions:**
${targetedAlert.explanation.recommended_defensive_actions.map((act: string, idx: number) => `${idx + 1}. ${act}`).join('\n')}`,
        sources,
        referenced_alerts: [targetedAlert.id],
        is_live_db_query: true,
        confidence: 0.95,
        query_category: 'THREAT_INVESTIGATION',
      };
    }

    // Specific incident investigation
    if (targetedIncident) {
      return {
        answer: `### Incident Briefing: **${targetedIncident.id}**

**Title:** ${targetedIncident.title}
- **Status:** \`${targetedIncident.status}\` | **Severity:** **${targetedIncident.severity}** (Composite Risk: **${targetedIncident.risk_score}/100**)
- **Assigned Analyst:** ${targetedIncident.assigned_analyst}
- **Linked Alerts:** ${targetedIncident.alert_ids.map((id: string) => `\`${id}\``).join(', ')}

**AI Correlation Summary:**
${targetedIncident.ai_summary}

**Active Containment Status:**
- IP Perimeter Block: ${targetedIncident.containment_status.ip_blocked ? '✅ Applied' : '⏳ Pending'}
- Host Isolation: ${targetedIncident.containment_status.host_isolated ? '✅ Isolated' : '⏳ Pending'}
- Firewall Drop Rules: ${targetedIncident.containment_status.firewall_rule_applied ? '✅ Active' : '⏳ Pending'}

**Recommended Next Steps:**
${targetedIncident.recommendations.map((r: string, idx: number) => `${idx + 1}. ${r}`).join('\n')}`,
        sources,
        referenced_incidents: [targetedIncident.id],
        referenced_alerts: targetedIncident.alert_ids,
        is_live_db_query: true,
        confidence: 0.94,
        query_category: 'THREAT_INVESTIGATION',
      };
    }

    // Live metrics / status query
    if (q.includes('today') || q.includes('critical') || q.includes('how many') || q.includes('threats') || q.includes('summary')) {
      const topAlertsList = criticalAlerts.map(a => `• **${a.id}** (${a.severity}): ${a.title} from \`${a.source_ip}\` (${a.country})`).join('\n');
      return {
        answer: `### Sentinel SOC Live Security Summary

**Current Platform Telemetry:**
- **Total Ingested Events:** ${summary.total_events.toLocaleString()}
- **Threats Identified:** **${summary.threats_detected}** (Detection Rate: **${summary.detection_rate_pct}%**, FP Rate: **${summary.false_positive_rate_pct}%**)
- **Critical Alerts Requiring Action:** **${summary.critical_alerts}**
- **Active Coordinated Incidents:** **${summary.active_incidents}**
- **Average Network Risk Score:** **${summary.avg_risk_score}/100**

**Top Priority Critical Alerts:**
${topAlertsList || 'No critical alerts active.'}

**Active Incidents:**
${recentIncidents.map(i => `• **${i.id}** [${i.status}]: ${i.title} (Risk: ${i.risk_score})`).join('\n')}`,
        sources,
        referenced_alerts: criticalAlerts.map(a => a.id),
        referenced_incidents: recentIncidents.map(i => i.id),
        is_live_db_query: true,
        confidence: 0.98,
        query_category: 'LIVE_METRICS',
      };
    }

    // Knowledge / RAG query
    if (sources.length > 0) {
      const topSource = sources[0];
      return {
        answer: `### Security Knowledge Retrieval: ${topSource.document_title}

Based on official documentation in the Sentinel Knowledge Base (${topSource.category}):

${topSource.snippet}

**Key Defensive Principles:**
- Maintain continuous host and network telemetry visibility.
- Implement strict defense-in-depth with least privilege access control.
- Ensure automated containment triggers (IP blacklisting, session revocation) are audited.

*Referenced sources have been retrieved from your indexed repository with cosine similarity ${Math.round(topSource.similarity_score * 100)}%.*`,
        sources,
        confidence: 0.91,
        query_category: 'KNOWLEDGE_RETRIEVAL',
      };
    }

    // General fallback
    return {
      answer: `### Sentinel Copilot Ready

I am actively monitoring the Sentinel AI platform. You can ask me:
- **"Summarize today's critical security alerts."**
- **"Why was alert AL-1042 classified as critical?"**
- **"What containment actions should we take for incident INC-8801?"**
- **"Explain NIST SP 800-61 incident response phases."**
- **"How does the Isolation Forest anomaly detector calculate risk?"**`,
      sources: [],
      confidence: 1.0,
      query_category: 'GENERAL_DEFENSE',
    };
  }
}

export const sentinelCopilot = new SentinelCopilotService();
