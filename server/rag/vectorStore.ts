import { RAGDocument } from '../../src/types';
import { initialKnowledgeDocuments } from './defaultDocs';

export interface SearchResult {
  document_id: string;
  document_title: string;
  category: string;
  chunk_id: string;
  chunk_index: number;
  content: string;
  similarity_score: number;
}

export class VectorStore {
  private documents: RAGDocument[] = [...initialKnowledgeDocuments];

  public getAllDocuments(): RAGDocument[] {
    return this.documents;
  }

  public getDocumentById(id: string): RAGDocument | undefined {
    return this.documents.find(d => d.id === id);
  }

  public addDocument(doc: RAGDocument): void {
    this.documents.unshift(doc);
  }

  public deleteDocument(id: string): boolean {
    const initialLen = this.documents.length;
    this.documents = this.documents.filter(d => d.id !== id);
    return this.documents.length < initialLen;
  }

  // Tokenization & Vector Cosine Similarity Search
  public search(query: string, topK: number = 3): SearchResult[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const allChunks: SearchResult[] = [];

    for (const doc of this.documents) {
      if (!doc.chunks) continue;
      for (const chunk of doc.chunks) {
        const chunkTokens = this.tokenize(chunk.content + ' ' + doc.title + ' ' + doc.category);
        const score = this.calculateCosineSimilarity(queryTokens, chunkTokens);

        if (score > 0.05) {
          allChunks.push({
            document_id: doc.id,
            document_title: doc.title,
            category: doc.category,
            chunk_id: chunk.id,
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            similarity_score: Number(score.toFixed(3)),
          });
        }
      }
    }

    allChunks.sort((a, b) => b.similarity_score - a.similarity_score);
    return allChunks.slice(0, topK);
  }

  private tokenize(text: string): string[] {
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for', 'to', 'of', 'with', 'by', 'this', 'that', 'it', 'from', 'as', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'if', 'what', 'how', 'why', 'when', 'where', 'who'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));
  }

  private calculateCosineSimilarity(queryTokens: string[], docTokens: string[]): number {
    const queryFreq: Record<string, number> = {};
    for (const t of queryTokens) queryFreq[t] = (queryFreq[t] || 0) + 1;

    const docFreq: Record<string, number> = {};
    for (const t of docTokens) docFreq[t] = (docFreq[t] || 0) + 1;

    const allUniqueTokens = new Set([...Object.keys(queryFreq), ...Object.keys(docFreq)]);

    let dotProduct = 0;
    let queryNormSq = 0;
    let docNormSq = 0;

    for (const token of allUniqueTokens) {
      const qVal = queryFreq[token] || 0;
      const dVal = docFreq[token] || 0;
      dotProduct += qVal * dVal;
      queryNormSq += qVal * qVal;
      docNormSq += dVal * dVal;
    }

    const magnitude = Math.sqrt(queryNormSq) * Math.sqrt(docNormSq);
    if (magnitude === 0) return 0;
    return dotProduct / magnitude;
  }
}

export const vectorStore = new VectorStore();
