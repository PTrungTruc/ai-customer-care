'use client';
import { useState } from 'react';
import UploadForm from './UploadForm';

export default function AdminPanel() {
  return (
    <div className="grid gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4">📚 Huấn luyện AI (Upload Tài liệu)</h2>
        <UploadForm />
      </div>
    </div>
  );
}