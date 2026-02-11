'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ConversationDetail from './ConversationDetail';
import { signOut, useSession } from 'next-auth/react';

export default function AdminConversationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: session } = useSession();
  const staffId = session?.user?.id;

  const fetchConversations = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/conversations');
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <>
      <Header title="Conversations" description="Quản lý hội thoại" />

      <div className="flex-1 overflow-auto p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}

            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  Không có hội thoại
                </TableCell>
              </TableRow>
            )}

            {data.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.user.name}</TableCell>
                <TableCell>{c.status}</TableCell>
                <TableCell>
                  {new Date(c.createdAt).toLocaleString('vi-VN')}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelectedId(c.id)}>
                    👁 Xem
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* SLIDE OVER */}
      <Sheet open={!!selectedId} onOpenChange={(open) => {if (!open) { setSelectedId(null); fetchConversations();  }}}>
        <SheetContent side="right" className="w-[480px] p-0">
          {selectedId && <ConversationDetail id={selectedId} staffId={staffId || "" } />}
        </SheetContent>
      </Sheet>
    </>
  );
}
