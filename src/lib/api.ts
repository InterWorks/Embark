const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('embark-api-token');
}

export function setToken(token: string): void {
  localStorage.setItem('embark-api-token', token);
}

export function clearToken(): void {
  localStorage.removeItem('embark-api-token');
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  code?: string;
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
    // Return a typed response so callers don't need to handle undefined
    return { data: null, error: 'Unauthorized', code: 'UNAUTHORIZED' };
  }

  return res.json() as Promise<ApiResponse<T>>;
}

export const api = {
  get:    <T>(path: string)                        => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown)         => apiFetch<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)         => apiFetch<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)         => apiFetch<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                        => apiFetch<T>(path, { method: 'DELETE' }),
};
