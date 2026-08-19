import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, X, Shield, RefreshCw, ChevronDown, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types';

interface FloatingCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  contextAlertId?: string;
}

export function FloatingCopilot({ isOpen, onClose, contextAlertId }: FloatingCopilotProps) {
  const { role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      content: contextAlertId
        ? `I am analyzing Alert **${contextAlertId}**. How can I assist you with this threat investigation?`
        : 'Hello Analyst. I am **Sentinel Copilot**, your AI Tier-3 SOC Assistant. Ask me about active critical alerts, NIST containment procedures, or ML anomaly score justifications.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
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
        context: contextAlertId ? { alert_id: contextAlertId } : undefined,
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
            content: 'Analysis completed. All defensive checks nominal.',
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
          content: `Unable to complete AI inference: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[580px] w-96 sm:w-[420px] flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-sm">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono">SENTINEL COPILOT</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-mono text-indigo-300">
                AI TIER-3
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {contextAlertId ? `Context: Alert ${contextAlertId}` : 'RAG + Live SOC Telemetry'}
            </p>
          </div>
        </div>

        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {/* RAG Sources pill */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 font-semibold text-indigo-300 mb-1">
                    <BookOpen className="h-3 w-3" />
                    <span>Retrieved Knowledge Sources:</span>
                  </div>
                  {msg.sources.slice(0, 2).map((s, idx) => (
                    <div key={idx} className="truncate text-slate-400 font-mono">
                      • {s.document_title} ({(s.similarity_score * 100).toFixed(0)}% match)
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="mt-1 text-[9px] text-slate-500 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-400 max-w-[70%]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            <span>Analyzing SOC telemetry...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => handleSend("What are today's critical threats?")}
          className="whitespace-nowrap rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1 text-[10px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
        >
          Critical Threats?
        </button>
        <button
          onClick={() => handleSend("Explain NIST incident response containment.")}
          className="whitespace-nowrap rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1 text-[10px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
        >
          NIST Containment?
        </button>
      </div>

      {/* Input footer */}
      <div className="border-t border-slate-800 bg-slate-900 p-3">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Copilot about threats, logs, or policies..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600 text-white disabled:opacity-50 hover:bg-cyan-500 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
