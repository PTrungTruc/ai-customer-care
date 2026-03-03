'use client';

import { useEffect } from "react";
import { useSession, signIn } from 'next-auth/react';
export default function EmbedSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    async function syncUser() {
      if (status === "unauthenticated") {
        const res = await fetch("/api/get-custom-user");
        const user = await res.json();

        if (user) {
          // Đăng nhập người dùng vào NextAuth thông qua signIn
          await signIn('credentials', {
            email: user.email,
            password: user.password,  // Chắc chắn rằng bạn có mật khẩu trong user object
            redirect: false,
          });

          window.location.reload();
        }
      }
    }

    syncUser();
  }, [status]);

  return null;
}