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
