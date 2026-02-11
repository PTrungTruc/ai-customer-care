// import { ChromaClient, Collection } from 'chromadb';
// import { embeddingService } from '@/lib/embeddings';

// const CHROMA_URL = process.env.CHROMA_DB_URL || 'http://localhost:8000';

// export class VectorStore {
//   private client: ChromaClient;
//   private collection: Collection | null = null;

//   constructor() {
//     this.client = new ChromaClient({ path: CHROMA_URL });
//   }

//   async initialize(): Promise<void> {
//     this.collection = await this.client.getOrCreateCollection({
//       name: 'customer-care',
//       metadata: { "hnsw:space": "cosine" }
//     });
//   }

//   async addDocuments(contents: string[], metadata: Record<string, any>[]): Promise<void> {
//     if (!this.collection) await this.initialize();

//     // Tạo ID unique
//     const ids = contents.map((_, i) => `doc_${Date.now()}_${i}`);

//     // Tạo embedding
//     const embeddingsResult = await embeddingService.createBatchEmbeddings(contents);
//     const embeddings = embeddingsResult.map(e => e.embedding);

//     await this.collection!.add({
//       ids,
//       embeddings,
//       metadatas: metadata,
//       documents: contents,
//     });
//   }

//   async search(query: string, topK: number = 5): Promise<any[]> {
//     if (!this.collection) await this.initialize();

//     const queryEmbedding = await embeddingService.createEmbedding(query);
//     const results = await this.collection!.query({
//       queryEmbeddings: [queryEmbedding.embedding],
//       nResults: topK,
//     });

//     if (!results.documents[0]) return [];

//     // Map về format cũ để không sửa UI
//     return results.documents[0].map((doc, i) => ({
//       document: { 
//         content: doc, 
//         metadata: results.metadatas[0]?.[i] || {} 
//       },
//       score: 1 - (results.distances?.[0]?.[i] || 0) // Convert distance to score
//     }));
//   }

//   async clear(): Promise<void> {
//     try {
//       await this.client.deleteCollection({ name: 'customer-care' });
//     } catch (e) {}
//     await this.initialize();
//   }

//   getDocumentCount(): number {
//     return 0; // Chroma chưa support count trực tiếp nhanh, tạm return 0
//   }
// }

// export const vectorStore = new VectorStore();

import { prisma } from '@/lib/prisma'
import { openaiLLM } from '@/lib/llm/openai'
import { cosineSimilarity } from '@/lib/vector'

export interface VectorSearchResult {
  content: string
  filename: string
  category: string | null
  score: number
}

const SIMILARITY_THRESHOLD = 0.9

export class VectorStore {
  /* =========================
     SEARCH
  ========================= */
  async search(
    query: string,
    topK: number = 5
  ): Promise<VectorSearchResult[]> {
    const queryEmbedding = await openaiLLM.embed(query)

    const chunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          status: 'active',
        },
      },
      take: 50000,
      include: {
        document: {
          select: {
            filename: true,
            category: true,
          },
        },
      },
    })

    return chunks
      .map(chunk => ({
        content: chunk.content,
        filename: chunk.document.filename,
        category: chunk.document.category,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .filter(r => r.score >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  /* =========================
     ADD DOCUMENT CHUNKS
  ========================= */
  async addDocuments(documentId: string, contents: string[]) {
    const embeddings = await Promise.all(
      contents.map(c => openaiLLM.embed(c))
    )

    await prisma.documentChunk.createMany({
      data: contents.map((content, i) => ({
        documentId,
        content,
        embedding: embeddings[i],
        chunkIndex: i,
      })),
    })
  }

  /* =========================
     DELETE DOCUMENT
  ========================= */
  async deleteDocument(documentId: string): Promise<void> {
    await prisma.documentChunk.deleteMany({
      where: { documentId },
    })
  }

  /* =========================
     STATS
  ========================= */
  async getDocumentCount(): Promise<number> {
    return prisma.documentChunk.count()
  }
}

export const vectorStore = new VectorStore()