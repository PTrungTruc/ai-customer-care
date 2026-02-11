export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: string;
  username: string;
  role: string; // Prisma trả về string, nên ta để string ở đây cho dễ khớp
}

// Hàm kiểm tra quyền (Optional)
export const PERMISSIONS = {
  [UserRole.ADMIN]: ['chat', 'upload', 'manage'],
  [UserRole.USER]: ['chat'],
};