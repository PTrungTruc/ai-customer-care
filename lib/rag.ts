// import { searchSimilarChunks } from './chroma';
// import { generateEmbedding } from './ollama';
// import { RAGContext } from '@/types';

// export async function getRAGContext(query: string): Promise<string> {
//   try {
//     const queryEmbedding = await generateEmbedding(query);
//     const chunks = await searchSimilarChunks(queryEmbedding, 5);
    
//     if (chunks.length === 0) {
//       return 'Không tìm thấy thông tin liên quan trong tài liệu.';
//     }
    
//     const contextParts = chunks
//       .filter(chunk => chunk.score > 0.5)
//       .map((chunk, index) => {
//         const source = chunk.metadata.filename || 'Unknown';
//         return `[${index + 1}] Nguồn: ${source}
// ${chunk.content}`;
//       });
    
//     if (contextParts.length === 0) {
//       return 'Không tìm thấy thông tin liên quan trong tài liệu.';
//     }
    
//     return contextParts.join('\n\n---\n\n');
//   } catch (error) {
//     console.error('RAG context error:', error);
//     return 'Lỗi khi truy xuất thông tin từ tài liệu.';
//   }
// }

// export async function getRAGContextWithMetadata(query: string): Promise<RAGContext[]> {
//   try {
//     const queryEmbedding = await generateEmbedding(query);
//     const chunks = await searchSimilarChunks(queryEmbedding, 5);
    
//     return chunks
//       .filter(chunk => chunk.score > 0.5)
//       .map(chunk => ({
//         content: chunk.content,
//         metadata: {
//           filename: chunk.metadata.filename || 'Unknown',
//           category: chunk.metadata.category,
//           score: chunk.score,
//         },
//       }));
//   } catch (error) {
//     console.error('RAG context error:', error);
//     return [];
//   }
// }

import { vectorStore } from '@/rag/vector'
import { RAGContext } from '@/types'

export async function getRAGContext(query: string): Promise<string> {
  const results = await vectorStore.search(query, 5)

  if (results.length === 0) {
    return 'Không tìm thấy thông tin liên quan trong tài liệu.'
  }

  return results
    .map(
      (r, i) => `[${i + 1}] Nguồn: ${r.filename}
${r.content}`
    )
    .join('\n\n---\n\n')
}

export async function getRAGContextWithMetadata(
  query: string
): Promise<RAGContext[]> {
  const results = await vectorStore.search(query, 5)

  return results.map(r => ({
    content: r.content,
    metadata: {
      filename: r.filename,
      category: r.category,
      score: r.score,
    },
  }))
}