import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { FloatingCopilot } from './components/common/FloatingCopilot';

import { DashboardView } from './components/dashboard/DashboardView';
import { AlertsView } from './components/alerts/AlertsView';
import { IncidentsView } from './components/incidents/IncidentsView';
import { LiveMonitorView } from './components/live/LiveMonitorView';
import { EventsView } from './components/events/EventsView';
import { GeoThreatView } from './components/geo/GeoThreatView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CopilotPageView } from './components/copilot/CopilotPageView';
import { KnowledgeBaseView } from './components/knowledge/KnowledgeBaseView';
import { ModelsMonitoringView } from './components/models/ModelsMonitoringView';
import { UsersManagementView } from './components/admin/UsersManagementView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { SystemHealthView } from './components/system/SystemHealthView';
import { SettingsView } from './components/settings/SettingsView';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFloatingCopilotOpen, setIsFloatingCopilotOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const pageTitles: Record<NavTab, string> = {
    dashboard: 'SOC Overview & Threat Summary',
    alerts: 'Threats & Active Alerts',
    incidents: 'Incident Response & Correlation',
    live: 'Live SOC Radar & Telemetry Stream',
    events: 'Security Event Logs & Ingestion',
    geo: 'Global Geographic Threat Intelligence',
    analytics: 'Security Analytics & MITRE ATT&CK Matrix',
    copilot: 'Sentinel Copilot (Tier-3 AI)',
    knowledge: 'RAG Knowledge Base & Embeddings',
    models: 'ML Model Registry & Performance',
    users: 'Users & RBAC Enforcement',
    audit: 'SOC Compliance & Audit Trail',
    health: 'System Infrastructure Health',
    settings: 'Platform Settings & Sensitivity',
  };

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
    setActiveTab('alerts');
  };

  const handleOpenCopilotWithAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
    setIsFloatingCopilotOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        currentPageTitle={pageTitles[activeTab]}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleFloatingCopilot={() => setIsFloatingCopilotOpen(!isFloatingCopilotOpen)}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1">
        {/* Responsive Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Page Content */}
        <main
          className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full ${
            isSidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveTab}
              onSelectAlert={handleSelectAlert}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              onOpenCopilotWithContext={handleOpenCopilotWithAlert}
              selectedAlertId={selectedAlertId}
              onClearSelectedAlert={() => setSelectedAlertId(null)}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsView onSelectAlert={handleSelectAlert} />
          )}

          {activeTab === 'live' && <LiveMonitorView />}

          {activeTab === 'events' && <EventsView />}

          {activeTab === 'geo' && <GeoThreatView />}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'copilot' && <CopilotPageView />}

          {activeTab === 'knowledge' && <KnowledgeBaseView />}

          {activeTab === 'models' && <ModelsMonitoringView />}

          {activeTab === 'users' && <UsersManagementView />}

          {activeTab === 'audit' && <AuditLogsView />}

          {activeTab === 'health' && <SystemHealthView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={tab => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
      />

      {/* Floating Copilot Drawer */}
      <FloatingCopilot
        isOpen={isFloatingCopilotOpen}
        onClose={() => setIsFloatingCopilotOpen(false)}
        contextAlertId={selectedAlertId || undefined}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
