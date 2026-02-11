'use client';
import { useState } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setMsg('✅ Upload thành công!');
      else setMsg('❌ Lỗi: ' + data.error);
    } catch (e) {
      setMsg('❌ Lỗi kết nối');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input 
        type="file" 
        accept=".pdf,.docx,.txt"
        onChange={e => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <button 
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
      >
        {uploading ? 'Đang xử lý...' : 'Upload & Huấn luyện'}
      </button>
      {msg && <p className="text-sm font-medium">{msg}</p>}
    </div>
  );
}