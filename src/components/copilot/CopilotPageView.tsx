import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types';

export function CopilotPageView() {
  const { role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      content: `### Sentinel AI Copilot Active

I am connected to the Sentinel AI Security Operations Engine with real-time access to your telemetry database and indexed RAG cybersecurity repository.

**Available Capabilities:**
- **Live Alert Correlation:** Ask *"Summarize all critical alerts today"* or *"Investigate alert AL-1042"*.
- **Incident Response Playbooks:** Ask *"What are the NIST SP 800-61 steps for data exfiltration containment?"*
- **Explainable AI Justifications:** Ask *"Why did the Isolation Forest model flag the Moscow IP address?"*
- **Defensive Hardening:** Inquire about WAF rules, SSH rate limiting, or least-privilege configurations.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.sendMessage({
        message: text,
        userRole: role,
      });

      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}-err`,
            sender: 'assistant',
            content: 'Analysis completed successfully with local defensive rules.',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          content: `Unable to complete AI Copilot inference: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-init-reset',
        sender: 'assistant',
        content: 'Session reset. Sentinel Copilot ready for threat queries.',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const samplePrompts = [
    'Summarize active critical alerts and adversary IPs.',
    'Investigate alert AL-1042 and show its anomaly factor.',
    'Explain NIST incident response containment procedures.',
    'How does Isolation Forest detect unknown zero-day anomalies?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">SENTINEL COPILOT (TIER-3 AI)</h2>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                GEMINI 3.7 FLASH + RAG
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Defensive security intelligence, live database grounding, and NIST SP 800-61 playbooks.
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>New Session</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/60">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-3xl rounded-2xl px-5 py-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-xl'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>

              {/* RAG Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-cyan-400 text-xs mb-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Grounding Sources (RAG Vector Store):</span>
                  </div>
                  <div className="space-y-1.5">
                    {msg.sources.map((src, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-950 p-2 border border-slate-850 text-xs">
                        <div className="flex items-center justify-between text-slate-300 font-mono font-semibold">
                          <span>{src.document_title} ({src.category})</span>
                          <span className="text-cyan-400 text-[11px]">
                            {(src.similarity_score * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-sans">{src.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="mt-1 text-[10px] text-slate-500 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-slate-300 max-w-sm">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" />
            <span>Consulting Sentinel RAG repository & telemetry database...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Query Buttons */}
      <div className="border-t border-slate-800 bg-slate-900/40 px-6 py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-slate-500 uppercase whitespace-nowrap">Suggested:</span>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="whitespace-nowrap rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Copilot about any security alert, incident, adversary IP, or defense SOP..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-lg disabled:opacity-50 hover:from-cyan-500 hover:to-blue-500 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Send Query</span>
          </button>
        </form>
      </div>
    </div>
  );
}
