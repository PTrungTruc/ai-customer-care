export async function getConversations() {
  const res = await fetch('/api/admin/conversations', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch conversations');
  }

  return res.json();
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const apiUrl = (path: string) => {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
};