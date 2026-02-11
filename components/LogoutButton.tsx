'use client'; // Bắt buộc phải ở dòng 1

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Gọi API đăng xuất để xóa cookie
      await fetch('/api/auth', { method: 'DELETE' });
      
      // Chuyển hướng về trang login
      router.push('/login');
      router.refresh(); // Làm mới để xóa cache user cũ
    } catch (error) {
      console.error('Logout failed', error);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-all hover:shadow-md disabled:bg-gray-400"
    >
      {loading ? 'Đang thoát...' : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Đăng xuất
        </>
      )}
    </button>
  );
}