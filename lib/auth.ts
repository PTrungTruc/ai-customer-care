// import { NextAuthOptions } from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials';
// import { compare } from 'bcryptjs';
// import { prisma } from './prisma';
// import { UserRole } from '@/types';

// export const authOptions: NextAuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: 'Credentials',
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//         password: { label: 'Password', type: 'password' },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           return null;
//         }

//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email },
//         });

//         if (!user) {
//           return null;
//         }

//         const isValid = await compare(credentials.password, user.password);

//         if (!isValid) {
//           return null;
//         }

//         return {
//           id: user.id,
//           email: user.email,
//           name: user.name,
//           role: user.role,
//         };
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.role = user.role;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         session.user.role = token.role as UserRole;
//       }
//       return session;
//     },
//   },
//   pages: {
//     signIn: '/login',
//   },
//   session: {
//     strategy: 'jwt',
//     maxAge: 24 * 60 * 60, // 24 hours
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

// export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
//   return requiredRoles.includes(userRole);
// }

// export function canAccessResource(userRole: UserRole, resource: string): boolean {
//   const permissions: Record<UserRole, string[]> = {
//     USER: ['chat', 'conversations'],
//     STAFF: ['chat', 'conversations', 'staff-panel', 'handover'],
//     ADMIN: ['chat', 'conversations', 'staff-panel', 'handover', 'admin-panel', 'documents', 'training'],
//   };

//   return permissions[userRole]?.includes(resource) || false;
// }

// lib/auth.ts
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@/types';
import crypto from 'crypto';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Xác thực user bằng email + password
 */
export async function authenticate(email: string, password: string) {
  const  user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;
  const isValid = await compare(password, user.password) || password === user.password;
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
  };
}

/**
 * Tạo token đăng nhập (KHÔNG JWT)
 * Dùng random string + lưu DB nếu cần
 */
export async function createToken(user: {
  id: string;
  email: string;
  role: UserRole;
}) {
  const token = crypto.randomBytes(32).toString('hex');

  return token;
}

/**
 * Kiểm tra role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]) {
  return requiredRoles.includes(userRole);
}

/**
 * Kiểm tra quyền truy cập
 */
export function canAccessResource(userRole: UserRole, resource: string) {
  const permissions: Record<UserRole, string[]> = {
    USER: ['chat', 'conversations'],
    STAFF: ['chat', 'conversations', 'staff-panel', 'handover'],
    ADMIN: [
      'chat',
      'conversations',
      'staff-panel',
      'handover',
      'admin-panel',
      'documents',
      'training',
    ],
  };

  return permissions[userRole]?.includes(resource) ?? false;
}
