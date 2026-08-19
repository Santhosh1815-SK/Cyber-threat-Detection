import { RAGDocument } from '../../src/types';

export const initialKnowledgeDocuments: RAGDocument[] = [
  {
    id: 'doc-nist-800-61',
    title: 'NIST SP 800-61 Rev. 2: Computer Security Incident Handling Guide',
    category: 'NIST_FRAMEWORK',
    file_type: 'MARKDOWN',
    file_size_kb: 48,
    uploaded_at: '2026-08-01T10:00:00Z',
    uploaded_by: 'security-lead@sentinel.ai',
    status: 'INDEXED',
    chunk_count: 5,
    vector_dimensions: 768,
    snippet: 'Official NIST guidelines on incident handling phases: Preparation, Detection & Analysis, Containment, Eradication, Recovery, and Lessons Learned.',
    chunks: [
      {
        id: 'chunk-nist-1',
        chunk_index: 0,
        token_count: 310,
        content: `### Phase 1: Preparation and Prevention
Incident response preparation involves establishing and training an incident response team, acquiring necessary tools and resources, and implementing proactive measures to prevent incidents. Key prevention practices include:
- Host and Network Security Hardening: Apply least privilege, disable unnecessary ports and protocols, and maintain updated firmware.
- Malware Defense: Deploy Endpoint Detection and Response (EDR) sensors across all workstations and servers with real-time telemetry streaming.
- Awareness & Training: Train analysts on spotting credential stuffing, phishing, and volumetric reconnaissance indicators.`
      },
      {
        id: 'chunk-nist-2',
        chunk_index: 1,
        token_count: 345,
        content: `### Phase 2: Detection and Analysis
Detection encompasses identifying potential security incidents from SIEM alerts, ML anomaly detectors, IDS/IPS logs, and authentication records.
- Triage & Pre-filtering: Classify alerts based on risk score (Critical: 80-100, High: 60-79, Medium: 30-59).
- Evidence Corroboration: Cross-reference source IP reputation, authentication failure counts, byte transfer volumes, and time-of-day circadian deviations.
- Scope Determination: Identify which internal assets, subnets, and user accounts have been compromised or probed.`
      },
      {
        id: 'chunk-nist-3',
        chunk_index: 2,
        token_count: 320,
        content: `### Phase 3: Containment, Eradication, and Recovery
- Short-Term Containment: Isolate compromised host from the network VLAN, block the adversary source IP at perimeter edge firewalls, and terminate suspicious active session tokens.
- Long-Term Containment: Apply temporary firewall rules and restrict service account access permissions.
- Eradication: Remove malware binaries, eradicate persistence hooks (scheduled tasks, SUID binaries, cron jobs), and patch exploited vulnerabilities.
- Recovery: Restore systems from verified clean backups, test system integrity, and monitor for re-infection for 72 hours.`
      },
      {
        id: 'chunk-nist-4',
        chunk_index: 3,
        token_count: 280,
        content: `### Phase 4: Post-Incident Activity & Lessons Learned
Hold a post-incident review within 2 weeks of incident resolution.
- Identify how the incident occurred and what detection rules or ML models missed early indicators.
- Calculate Mean Time to Detect (MTTD) and Mean Time to Respond (MTTR).
- Update SIEM correlation rules, risk scoring weights, and automated containment playbooks.`
      }
    ]
  },
  {
    id: 'doc-owasp-top10',
    title: 'OWASP Top 10 2025: Defensive Implementation Guide',
    category: 'OWASP',
    file_type: 'MARKDOWN',
    file_size_kb: 36,
    uploaded_at: '2026-08-02T12:00:00Z',
    uploaded_by: 'appsec@sentinel.ai',
    status: 'INDEXED',
    chunk_count: 4,
    vector_dimensions: 768,
    snippet: 'Comprehensive defensive controls for the most critical web application security risks including Broken Access Control, Injection, and Authentication Failures.',
    chunks: [
      {
        id: 'chunk-owasp-1',
        chunk_index: 0,
        token_count: 360,
        content: `### A01: Broken Access Control & Privilege Escalation
Broken access control occurs when users can act outside their intended permissions.
Defensive Controls:
- Enforce Role-Based Access Control (RBAC) server-side on every API route handler. Never rely on client-side UI visibility toggles.
- Deny by default: Disallow all actions unless explicitly permitted for the user role (Admin, Analyst, Viewer).
- Disable web server directory listing and ensure file metadata/backup files are not present within web roots.
- Rate-limit API endpoints to prevent automated parameter enumeration and object reference tampering (BOLA/IDOR).`
      },
      {
        id: 'chunk-owasp-2',
        chunk_index: 1,
        token_count: 330,
        content: `### A03: Injection (SQL, Command, LDAP)
Injection occurs when untrusted user data is sent to an interpreter as part of a command or query.
Defensive Controls:
- Use parameterized queries (Prepared Statements) or an Object-Relational Mapper (ORM) for all database operations.
- Implement strict allowlist input validation for characters, lengths, and MIME types.
- Deploy Web Application Firewalls (WAF) to inspect incoming payloads for SQL syntax (e.g. UNION SELECT, OR 1=1, xp_cmdshell).
- Enforce least privilege database user accounts (e.g. web app user should never possess DROP TABLE or SUPERUSER privileges).`
      },
      {
        id: 'chunk-owasp-3',
        chunk_index: 2,
        token_count: 310,
        content: `### A07: Identification and Authentication Failures
Vulnerabilities allowing attackers to compromise passwords, keys, or session tokens.
Defensive Controls:
- Enforce Multi-Factor Authentication (MFA) across all administrative and analyst consoles.
- Implement adaptive rate-limiting and account lockout thresholds after 5 consecutive failed login attempts within 5 minutes.
- Require strong password entropy (minimum 12 characters, complexity requirements) and check against HaveIBeenPwned breach databases.
- Rotate and invalidate session identifiers immediately upon logout or privilege modification.`
      }
    ]
  },
  {
    id: 'doc-ransomware-sop',
    title: 'Enterprise Ransomware & Data Exfiltration Response Playbook',
    category: 'SOP',
    file_type: 'MARKDOWN',
    file_size_kb: 42,
    uploaded_at: '2026-08-05T08:30:00Z',
    uploaded_by: 'soc-manager@sentinel.ai',
    status: 'INDEXED',
    chunk_count: 3,
    vector_dimensions: 768,
    snippet: 'Immediate triage and containment playbook for ransomware outbreaks and unauthorized bulk data egress incidents.',
    chunks: [
      {
        id: 'chunk-ransom-1',
        chunk_index: 0,
        token_count: 350,
        content: `### Ransomware Outbreak Immediate Containment (First 15 Minutes)
1. Network Quarantine: Instantly revoke 802.1X network access or send EDR network isolation command to target endpoint.
2. Preserve Memory Dump: Prior to power-off, capture RAM image via EDR live response for cryptographic key recovery analysis.
3. Block Inbound/Outbound C2: Add adversary Command and Control (C2) IPs and domain IOCs to the perimeter firewall and DNS sinkhole.
4. Disable Compromised Credentials: Lock Active Directory / SSO user accounts associated with the infected machine.`
      },
      {
        id: 'chunk-ransom-2',
        chunk_index: 1,
        token_count: 320,
        content: `### Data Exfiltration Investigation & Egress Throttling
1. Detect Egress Anomalies: Check for spikes in outbound bytes sent (>10MB over non-standard protocols like DNS tunneling, ICMP payload, or raw TCP/HTTPS to unrecognized foreign IPs).
2. Protocol Inspection: Check proxy logs for bulk cloud storage uploads (Mega, Dropbox, AWS S3 buckets outside company organization).
3. Session Termination: Invalidate active AWS/Azure/GCP IAM tokens and API keys used by the exfiltrating workstation.
4. Legal & Regulatory Notice: Trigger incident clock for GDPR/HIPAA breach notification assessment if PII was staged.`
      }
    ]
  },
  {
    id: 'doc-port-scan-sop',
    title: 'Network Reconnaissance & Port Sweep Triage Standard',
    category: 'INCIDENT_RESPONSE',
    file_type: 'MARKDOWN',
    file_size_kb: 24,
    uploaded_at: '2026-08-08T14:10:00Z',
    uploaded_by: 'netsec@sentinel.ai',
    status: 'INDEXED',
    chunk_count: 2,
    vector_dimensions: 768,
    snippet: 'Standard operating procedure for analyzing and responding to SYN sweeps, horizontal and vertical port scanning behavior.',
    chunks: [
      {
        id: 'chunk-scan-1',
        chunk_index: 0,
        token_count: 290,
        content: `### Port Scanning Classification
- Horizontal Scanning: Probing a single port (e.g. TCP 22 SSH, TCP 3389 RDP, TCP 445 SMB) across a wide range of subnet IP addresses.
- Vertical Scanning: Probing multiple ports (1-65535) on a single destination host to map exposed attack surfaces.
- Distributed Scan: Coordinated reconnaissance originating from multiple distinct botnet IP addresses targeting perimeter assets.`
      },
      {
        id: 'chunk-scan-2',
        chunk_index: 1,
        token_count: 280,
        content: `### Defensive Remediation Actions
1. Perimeter Drop Rule: Auto-blacklist scanning IP at edge border routers if probe rate exceeds 20 ports/second.
2. Service Minimization: Ensure management interfaces (SSH, RDP, Webmin, Kubernetes Dashboard) are restricted to VPN / Zero Trust bastion subnets.
3. Honey-port Deployment: Deploy honeypot listening sockets on unused ports (e.g. 23, 2222, 8080) to automatically trigger immediate IP ban upon connection.`
      }
    ]
  }
];
