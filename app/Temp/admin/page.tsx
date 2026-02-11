'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // State cho thông báo Toast
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const router = useRouter();

  // Hàm hiện thông báo
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    // Tự động tắt sau 3 giây
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/upload');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 500);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      clearInterval(interval);
      
      if (data.success) { 
        setProgress(100);
        showToast('✅ Đã học xong tài liệu mới!', 'success'); // <--- HIỆN THÔNG BÁO Ở ĐÂY
        fetchDocs();
      } else {
        showToast('❌ Lỗi: ' + data.error, 'error');
      }
    } catch (err) { 
      clearInterval(interval);
      showToast('❌ Lỗi kết nối server', 'error');
    } finally {
      // Ẩn thanh progress sau 1 giây cho đẹp
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if(!confirm(`Xóa kiến thức: ${filename}?`)) return;
    await fetch(`/api/upload?id=${id}&filename=${filename}`, { method: 'DELETE' });
    showToast('🗑️ Đã xóa tài liệu', 'success');
    fetchDocs();
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans relative">
      
      {/* 🔔 THÔNG BÁO TOAST (GÓC PHẢI TRÊN) */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in transition-all transform duration-300 ${
          toast.type === 'success' ? 'bg-white border-l-4 border-green-500 text-gray-800' : 'bg-white border-l-4 border-red-500 text-gray-800'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          )}
          <div>
            <h4 className="font-bold text-sm">{toast.type === 'success' ? 'Thành công' : 'Thất bại'}</h4>
            <p className="text-sm text-gray-600">{toast.message}</p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl fixed h-full z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold tracking-wider">ADMIN CP</h1>
          <p className="text-xs text-slate-400 mt-1">Hệ thống quản trị AI</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="px-4 py-3 bg-blue-600 rounded-lg text-white font-medium cursor-default">📊 Quản lý Tài liệu</div>
          <Link href="/chat" className="block px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">💬 Vào trang Chat</Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors text-sm font-medium">🚪 Đăng xuất</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Kho Tri Thức</h2>
            <p className="text-gray-500 text-sm">Quản lý dữ liệu học tập cho AI (Model: Qwen 2.5)</p>
          </div>
          <label className={`cursor-pointer px-6 py-2.5 rounded-lg text-white font-medium shadow-md transition-transform active:scale-95 ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.docx,.xlsx" disabled={uploading} />
            {uploading ? '⏳ Đang xử lý...' : '➕ Thêm Tài Liệu'}
          </label>
        </header>

        {/* Thanh tiến trình */}
        {uploading && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Đang đọc & Train AI...</span>
              <span className="text-sm font-medium text-blue-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* Bảng dữ liệu */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên file</th>
                <th className="px-6 py-4">Kích thước</th>
                <th className="px-6 py-4">Ngày upload</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : documents.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Chưa có dữ liệu</td></tr>
              ) : documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{doc.filename}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{(doc.size / 1024).toFixed(1)} KB</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(doc.id, doc.filename)} className="text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}