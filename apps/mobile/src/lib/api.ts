const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    });

    if (!res.ok) {
      let err: any;
      try {
        err = await res.json();
      } catch {
        err = { error: { message: await res.text() } };
      }
      throw new Error(err?.error?.message || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const api = new ApiClient();

export async function getAuthUrl(redirectUri: string) {
  const res = await fetch(
    `${API_URL}/v0/api/auth/start?redirect_uri=${encodeURIComponent(redirectUri)}`
  );
  if (!res.ok) {
    throw new Error('Failed to get auth URL');
  }
  const data = await res.json();
  return data.authorizeUrl;
}

export async function exchangeSession(code: string) {
  return api.post<{ token: string }>('/v0/api/auth/session', { code });
}

export async function me() {
  return api.get<{
    id: number;
    username: string;
    avatarUrl: string | null;
    onboarded: boolean;
    likedPublic: boolean;
    savedPublic: boolean;
  }>('/v0/api/me');
}
