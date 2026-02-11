// import { ChromaClient } from 'chromadb';
// import { getEmbeddings } from './ollama';

// const client = new ChromaClient({ path: process.env.CHROMADB_URL });

// export async function addToVectorStore(content: string, metadata: any) {
//   const collection = await client.getOrCreateCollection({
//     name: "customer-support",
//     metadata: { "hnsw:space": "cosine" }
//   });

//   // Chia nhỏ văn bản (Chunking đơn giản)
//   const chunks = content.match(/[\s\S]{1,500}/g) || [];
  
//   for (let i = 0; i < chunks.length; i++) {
//     const chunk = chunks[i];
//     const embedding = await getEmbeddings(chunk);
    
//     await collection.add({
//       ids: [`${metadata.filename}-${Date.now()}-${i}`],
//       embeddings: [embedding],
//       metadatas: [{ ...metadata, text: chunk }],
//       documents: [chunk]
//     });
//   }
// }

// export async function searchContext(query: string) {
//   const collection = await client.getOrCreateCollection({ name: "customer-support" });
//   const queryEmbedding = await getEmbeddings(query);
  
//   const results = await collection.query({
//     queryEmbeddings: [queryEmbedding],
//     nResults: 3, // Lấy 3 đoạn văn bản liên quan nhất
//   });

//   return results.metadatas[0]?.map(m => m?.text).join('\n---\n') || "";
// }

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}