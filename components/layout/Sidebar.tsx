'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, BarChart3, Users, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['USER', 'STAFF', 'ADMIN'] },
    { name: 'Staff Panel', href: '/staff', icon: Users, roles: ['STAFF', 'ADMIN'] },
    { name: 'Documents', href: '/admin/documents', icon: FileText, roles: ['ADMIN'] },
    { name: 'Conversations', href: '/admin/conversations', icon: MessageSquare, roles: ['ADMIN'] },
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, roles: ['ADMIN'] },
  ];

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(session?.user?.role || 'USER')
  );

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Customer Care AI</h1>
        <p className="text-sm text-muted-foreground mt-1">{session?.user?.name}</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          onClick={() => signOut({ callbackUrl: '/login' })}
          variant="ghost"
          className="w-full justify-start"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}