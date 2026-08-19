import { RAGDocument } from '../../src/types';

export class DocumentProcessor {
  public static chunkDocument(
    title: string,
    rawText: string,
    chunkSizeWords: number = 180,
    overlapWords: number = 30
  ): { id: string; chunk_index: number; content: string; token_count: number }[] {
    const cleanText = rawText.replace(/\r\n/g, '\n').trim();
    const words = cleanText.split(/\s+/);
    const chunks: { id: string; chunk_index: number; content: string; token_count: number }[] = [];

    if (words.length <= chunkSizeWords) {
      chunks.push({
        id: `chunk-${Date.now()}-0`,
        chunk_index: 0,
        content: cleanText,
        token_count: Math.round(words.length * 1.3),
      });
      return chunks;
    }

    let index = 0;
    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSizeWords, words.length);
      const chunkWords = words.slice(start, end);
      const chunkContent = chunkWords.join(' ');

      chunks.push({
        id: `chunk-${Date.now()}-${index}`,
        chunk_index: index,
        content: chunkContent,
        token_count: Math.round(chunkWords.length * 1.3),
      });

      index++;
      start += chunkSizeWords - overlapWords;
      if (start >= words.length - overlapWords) break;
    }

    return chunks;
  }
}
