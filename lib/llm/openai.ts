// import OpenAI from 'openai'
// import { LLM, ChatMessage } from './index'

// const client = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// })

// export const openaiLLM: LLM = {
//     async streamChat(messages, onToken) {
//         const stream = await client.chat.completions.create({
//             model: 'gpt-4.1-mini',
//             messages,
//             stream: true,
//         })

//         for await (const part of stream) {
//             const token = part.choices[0]?.delta?.content
//             if (token) onToken(token)
//         }
//     },

//     async embed(text) {
//         const res = await client.embeddings.create({
//             model: 'text-embedding-3-small',
//             input: text,
//         })
//         return res.data[0].embedding
//     },

//     async generateTitle(text) {
//         const res = await client.chat.completions.create({
//             model: 'gpt-4.1-mini',
//             messages: [
//                 { role: 'system', content: 'Tạo tiêu đề ngắn (tối đa 6 từ)' },
//                 { role: 'user', content: text },
//             ],
//         })
//         return res.choices[0].message.content || 'Hội thoại mới'
//     },
// }

import { GoogleGenerativeAI } from '@google/generative-ai'
import { LLM, ChatMessage } from './index'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/* =========================
   BUILD PROMPT (CHAT)
========================= */
function buildPrompt(messages: ChatMessage[]) {
    return messages
        .map(m => {
            if (m.role === 'system') return `SYSTEM:\n${m.content}`
            if (m.role === 'assistant') return `ASSISTANT:\n${m.content}`
            return `USER:\n${m.content}`
        })
        .join('\n\n')
}

export const openaiLLM: LLM = {
    /* =========================
       CHAT STREAM
    ========================= */
    async streamChat(messages, onToken) {
        // Tìm Model tương thích
        // const res = await fetch(
        //     `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        // )

        // if (!res.ok) {
        //     throw new Error(`ListModels failed: ${res.status}`)
        // }

        // const data = await res.json()
        // console.log(data.models)
        const model = genAI.getGenerativeModel({
            model: 'gemma-3-1b-it', // gemini-2.5-flash
        })

        const prompt = buildPrompt(messages)

        const result = await model.generateContentStream(prompt)

        for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) onToken(text)
        }
    },

    /* =========================
       EMBEDDING (GEMINI)
    ========================= */
    async embed(text: string): Promise<number[]> {
        const model = genAI.getGenerativeModel({
            model: 'gemini-embedding-001', // ✅ ĐÚNG
        })

        const result = await model.embedContent(text)

        return result.embedding.values
    },

    /* =========================
       TITLE GENERATION
    ========================= */
    async generateTitle(text: string) {
        const model = genAI.getGenerativeModel({
            model: 'gemma-3-1b-it', // gemini-2.5-flash
        })

        const result = await model.generateContent(
            `Tạo duy nhất 1 tiêu đề ngắn mô tả đúng, không dài dòng và vào trọng tâm với kết quả trả ra là nội dung của tiêu đề luôn: ${text}`
        )

        return result.response.text() || 'Hội thoại mới'
    },
}