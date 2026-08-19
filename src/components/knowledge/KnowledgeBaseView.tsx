import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Upload,
  Search,
  FileText,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  ExternalLink,
  Plus,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { RAGDocument } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function KnowledgeBaseView() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<RAGDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vector Search Tester State
  const [testQuery, setTestQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SOP');
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]);
      }
    } catch (err) {
      console.error('Error loading RAG documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchTester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await api.searchKnowledge(testQuery, 3);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsUploading(true);
    try {
      const newDoc = await api.uploadDocument({
        title,
        category,
        content,
        uploaded_by: user?.email || 'analyst@sentinel.ai',
      });
      setDocuments(prev => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
      setIsUploadOpen(false);
      setTitle('');
      setContent('');
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document from the vector index?')) return;
    try {
      await api.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err: any) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-cyan-400" />
            RAG KNOWLEDGE BASE & EMBEDDINGS STORE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cybersecurity frameworks (NIST, OWASP), incident response playbooks, and company SOC SOPs vector-indexed for AI retrieval.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Main Split Layout: Document List + Document/Chunk Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document List */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Indexed Documents ({documents.length})
          </span>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {documents.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-cyan-500/60 bg-gradient-to-br from-slate-900 to-cyan-950/30 shadow-md'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300 font-bold">
                        {doc.category}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{doc.file_type}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                      {doc.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mt-2">{doc.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{doc.snippet}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-cyan-400" />
                      <span>{doc.chunk_count} Chunks (dim: {doc.vector_dimensions})</span>
                    </span>
                    <span>{doc.file_size_kb} KB</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Selected Document & Chunk Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {selectedDoc ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/40">
                      {selectedDoc.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Added: {formatDateTime(selectedDoc.uploaded_at)}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1.5">{selectedDoc.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Author: {selectedDoc.uploaded_by}</p>
                </div>

                <button
                  onClick={() => handleDelete(selectedDoc.id)}
                  title="Delete Document"
                  className="rounded-lg p-2 text-rose-400 hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Chunk Inspector */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Indexed Vector Chunks ({selectedDoc.chunks.length})
                </h4>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {selectedDoc.chunks.map(chunk => (
                    <div
                      key={chunk.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="text-cyan-400 font-bold">{chunk.id}</span>
                        <span>
                          Chunk #{chunk.chunk_index + 1} | {chunk.token_count} Tokens
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500 font-mono text-xs">
              Select a document to inspect its chunk representations.
            </div>
          )}

          {/* RAG Vector Search Playground */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Cosine Similarity Search Tester
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Test semantic vector retrieval against the indexed cybersecurity documents in real-time.
            </p>

            <form onSubmit={handleSearchTester} className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={e => setTestQuery(e.target.value)}
                placeholder="e.g., How to isolate a host during ransomware outbreak?"
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!testQuery.trim() || isSearching}
                className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
              >
                Search Vectors
              </button>
            </form>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono text-slate-400">Top Semantic Matches:</span>
                {searchResults.map((res, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-mono font-semibold">
                      <span>{res.document_title} ({res.category})</span>
                      <span className="text-cyan-400 font-bold">
                        {(res.similarity_score * 100).toFixed(1)}% Similarity
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1 font-sans leading-relaxed">{res.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Upload className="h-4 w-4 text-cyan-400" />
                INDEX NEW CYBERSECURITY DOCUMENT
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., SOP-402: Cloud Bastion Security Baseline"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="SOP">Standard Operating Procedure (SOP)</option>
                  <option value="PLAYBOOK">Incident Response Playbook</option>
                  <option value="POLICY">Security Policy</option>
                  <option value="FRAMEWORK">NIST / OWASP / ISO Framework</option>
                  <option value="CVE_BULLETIN">CVE Threat Advisory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Document Text Content</label>
                <textarea
                  rows={8}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste Markdown or plain text content here..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 font-sans text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title || !content || isUploading}
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>{isUploading ? 'Chunking & Indexing...' : 'Index Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
