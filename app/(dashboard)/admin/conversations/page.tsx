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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const { data: session } = useSession();
  const staffId = session?.user?.id;

  // const fetchConversations = async () => {
  //   setLoading(true);
  //   const res = await fetch('/api/admin/conversations');
  //   const json = await res.json();
  //   setData(json);
  //   setLoading(false);
  // };
  const fetchConversations = async (pageNumber = 1) => {
    setLoading(true);
    setData([]);

    const res = await fetch(`/api/admin/conversations?page=${pageNumber}&limit=${pageSize}`);
    const json = await res.json();

    setData(json.data);
    setTotal(json.total);
    setPage(pageNumber);

    setLoading(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    fetchConversations(page);
  }, []);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return { pages, start, end };
  };
  const {pages, start, end} = getPageNumbers();

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
      {/* Thanh Page  */}

      <div className="flex items-center justify-between mt-6 mx-3 mb-2">
        <div className="text-sm text-muted-foreground"> Tổng {total} hội thoại </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchConversations(page - 1)}>
            Prev
          </Button>

          {start > 1 && (
            <>
              <Button size="sm" variant="outline" onClick={() => fetchConversations(1)}>1</Button>
              {start > 2 && <span className="px-1">...</span>}
            </>
          )}

          {pages.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === page ? "default" : "outline"}
              onClick={() => fetchConversations(p)}
              className="w-9"
            >
              {p}
            </Button>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1">...</span>}
              <Button size="sm" variant="outline" onClick={() => fetchConversations(totalPages)}>
                {totalPages}
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => fetchConversations(page + 1)}>
            Next
          </Button>
        </div>
      </div>

      {/* SLIDE OVER */}
      <Sheet open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); fetchConversations(page); } }}>
        <SheetContent side="right" className="w-[480px] p-0">
          {selectedId && <ConversationDetail id={selectedId} staffId={staffId || ""} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
