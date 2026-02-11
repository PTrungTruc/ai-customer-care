// ChromaDB HTTP Client - No package dependencies
const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = process.env.CHROMA_PORT || '8000';
const CHROMA_BASE_URL = `http://${CHROMA_HOST}:${CHROMA_PORT}`;
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'customer_care_docs';

interface ChromaDocument {
  id: string;
  embedding: number[];
  document: string;
  metadata: any;
}

interface ChromaCollection {
  name: string;
  id: string;
  metadata: any;
}

async function chromaFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${CHROMA_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ChromaDB error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function initChroma(): Promise<void> {
  try {
    const collections = await chromaFetch('/api/v1/collections');
    
    const exists = collections.some((c: ChromaCollection) => c.name === COLLECTION_NAME);
    
    if (!exists) {
      await chromaFetch('/api/v1/collections', {
        method: 'POST',
        body: JSON.stringify({
          name: COLLECTION_NAME,
          metadata: { 'hnsw:space': 'cosine' },
        }),
      });
    }
  } catch (error) {
    console.error('ChromaDB init error:', error);
    throw error;
  }
}

export async function addDocumentChunks(
  chunks: string[],
  embeddings: number[][],
  metadata: {
    filename: string;
    category?: string;
    version: string;
    documentId: string;
  }
): Promise<void> {
  await initChroma();
  
  const ids: string[] = [];
  const documents: string[] = [];
  const metadatas: any[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    ids.push(`${metadata.documentId}-chunk-${i}`);
    documents.push(chunks[i]);
    metadatas.push({
      ...metadata,
      chunkIndex: i,
      totalChunks: chunks.length,
    });
  }
  
  await chromaFetch(`/api/v1/collections/${COLLECTION_NAME}/add`, {
    method: 'POST',
    body: JSON.stringify({
      ids,
      embeddings,
      documents,
      metadatas,
    }),
  });
}

export async function searchSimilarChunks(
  queryEmbedding: number[],
  limit: number = 5
): Promise<{ content: string; metadata: any; score: number }[]> {
  await initChroma();
  
  const results = await chromaFetch(`/api/v1/collections/${COLLECTION_NAME}/query`, {
    method: 'POST',
    body: JSON.stringify({
      query_embeddings: [queryEmbedding],
      n_results: limit,
    }),
  });
  
  const chunks: { content: string; metadata: any; score: number }[] = [];
  
  if (results.documents && results.documents[0] && results.metadatas && results.metadatas[0] && results.distances && results.distances[0]) {
    for (let i = 0; i < results.documents[0].length; i++) {
      chunks.push({
        content: results.documents[0][i] || '',
        metadata: results.metadatas[0][i] || {},
        score: 1 - (results.distances[0][i] || 0),
      });
    }
  }
  
  return chunks;
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await initChroma();
  
  try {
    const results = await chromaFetch(`/api/v1/collections/${COLLECTION_NAME}/get`, {
      method: 'POST',
      body: JSON.stringify({
        where: { documentId },
      }),
    });
    
    if (results.ids && results.ids.length > 0) {
      await chromaFetch(`/api/v1/collections/${COLLECTION_NAME}/delete`, {
        method: 'POST',
        body: JSON.stringify({
          ids: results.ids,
        }),
      });
    }
  } catch (error) {
    console.error('Delete chunks error:', error);
  }
}

export async function checkChromaHealth(): Promise<boolean> {
  try {
    await chromaFetch('/api/v1/heartbeat');
    return true;
  } catch {
    return false;
  }
}