import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canAccessResource } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDocumentChunks } from '@/lib/chroma';
import { generateEmbedding } from '@/lib/ollama';
import { chunkText } from '@/lib/utils';
import { readFile } from 'fs/promises';
import { join } from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

async function extractText(filepath: string, type: string): Promise<string> {
  if (type === 'text/plain') {
    return await readFile(filepath, 'utf-8');
  }
  
  if (type === 'application/pdf') {
    const dataBuffer = await readFile(filepath);
    const data = await pdf(dataBuffer);
    return data.text;
  }
  
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filepath });
    return result.value;
  }
  
  throw new Error('Unsupported file type');
}

// export async function POST(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
    
//     if (!session?.user || !canAccessResource(session.user.role, 'training')) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { documentId } = await req.json();
    
//     if (!documentId) {
//       return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
//     }

//     const document = await prisma.document.findUnique({
//       where: { id: documentId },
//     });

//     if (!document) {
//       return NextResponse.json({ error: 'Document not found' }, { status: 404 });
//     }

//     const metadata = document.metadata as any;
//     const filepath = join(process.cwd(), 'docs', metadata.storedAs);

//     const text = await extractText(filepath, metadata.type);

//     const cleanedText = text
//       .replace(/\s+/g, ' ')
//       .replace(/\n+/g, '\n')
//       .trim();

//     const chunks = chunkText(cleanedText, 400, 75);

//     // Generate embeddings for all chunks
//     const embeddings: number[][] = [];
//     for (const chunk of chunks) {
//       const embedding = await generateEmbedding(chunk);
//       embeddings.push(embedding);
//     }

//     await addDocumentChunks(chunks, embeddings, {
//       filename: document.filename,
//       category: document.category || undefined,
//       version: document.version,
//       documentId: document.id,
//     });

//     await prisma.document.update({
//       where: { id: document.id },
//       data: { chunks: chunks.length },
//     });

//     return NextResponse.json({
//       success: true,
//       chunks: chunks.length,
//       documentId: document.id,
//     });
//   } catch (error) {
//     console.error('Training error:', error);
//     return NextResponse.json(
//       { error: 'Training failed' },
//       { status: 500 }
//     );
//   }
// }

import { vectorStore } from '@/rag/vector'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canAccessResource(session.user.role, 'training')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await req.json()

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 1️⃣ Delete old chunks (important!)
    await vectorStore.deleteDocument(documentId)

    // 2️⃣ Extract text
    const metadata = document.metadata as any
    const filepath = join(process.cwd(), 'docs', metadata.storedAs)

    const text = await extractText(filepath, metadata.type)

    const cleanedText = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()

    const chunks = chunkText(cleanedText, 500, 150) // Điều chỉnh để hiệu suất tạo chunk được hợp lý

    // 3️⃣ Save chunks using new vectorStore
    await vectorStore.addDocuments(documentId, chunks)

    // 4️⃣ Update document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        chunks: chunks.length,
        status: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      chunks: chunks.length,
    })
  } catch (error) {
    console.error('Training error:', error)
    return NextResponse.json(
      { error: 'Training failed' },
      { status: 500 }
    )
  }
}