'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from "react-markdown";

export default function ConversationDetail({ id, staffId }: { id: string, staffId : string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const updateStatus = async (status: string) => {
        if (!status.startsWith("HANDOVER")) {staffId = "";} 
        console.log("TEST: " + staffId);
        const res = await fetch(`/api/admin/conversations/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, staffId }),
        });
        const updated = await res.json();
        setData(updated);
    };

    useEffect(() => {
        fetch(`/api/admin/conversations/${id}`)
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [data]);

    if (loading) {
        return <div className="p-6 text-center text-muted-foreground">Đang tải...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* HEADER */}
            <div className="p-4 border-b bg-white">
                <div className="font-semibold">{data.user.name}</div>
                <div className="font-semibold">TITLE - <span className='italic'>{data.title}</span></div>
                <div className="text-sm text-muted-foreground">
                    <span
                        className={`inline-flex items-center gap-2 font-medium ${data.status === 'ACTIVE'
                            ? 'text-green-600'
                            : data.status === 'HANDOVER_ACCEPTED'
                                ? 'text-blue-600'
                                : 'text-red-600'
                            }`}
                    > ● {data.status} </span> {' • '} {new Date(data.createdAt).toLocaleString('vi-VN')}
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {data.messages.map((msg: any) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white border rounded-tl-none'
                                }`}
                        >
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* ACTIONS */}
            <div className="p-4 border-t bg-white flex gap-2">
                {/* {data.status === 'ACTIVE' && (
                    <Button
                        size="sm"
                        onClick={() => updateStatus('HANDOVER_ACCEPTED')}
                    >
                        Nhận handover
                    </Button>
                )} */}

                {data.status !== 'CLOSED' && !data.status.startsWith("HANDOVER") && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus('CLOSED')}
                    >
                        Đóng
                    </Button>
                )}

                {data.status === 'CLOSED' && (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus('ACTIVE')}
                    >
                        Mở lại
                    </Button>
                )}
            </div>
        </div>
    );
}
