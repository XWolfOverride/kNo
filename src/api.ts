import { Item, User } from './types';

const TOKEN_KEY = 'kno_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // First-Run Bootstrap Setup
  async getSetupStatus(): Promise<{ needsSetup: boolean }> {
    return request<{ needsSetup: boolean }>('/api/auth/setup-status');
  },

  async setupInitialAdmin(payload: {
    username: string;
    password: string;
    name?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(username: string, password: string, name?: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredToken(null);
    }
  },

  // Items
  async getItems(params?: { category?: string; search?: string }): Promise<Item[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString();
    const endpoint = `/api/items${qs ? `?${qs}` : ''}`;
    const res = await request<{ items: Item[] }>(endpoint);
    return res.items;
  },

  async createItem(payload: {
    title: string;
    categories: string | string[];
    urls?: { url: string; description: string }[];
    content?: string;
    notes?: string;
  }): Promise<Item> {
    const res = await request<{ item: Item }>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.item;
  },

  async updateItem(
    id: string,
    payload: {
      title: string;
      categories: string | string[];
      urls?: { url: string; description: string }[];
      content?: string;
      notes?: string;
    }
  ): Promise<Item> {
    const res = await request<{ item: Item }>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.item;
  },

  async deleteItem(id: string): Promise<void> {
    await request(`/api/items/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin User Management
  async getAdminUsers(): Promise<User[]> {
    const res = await request<{ users: User[] }>('/api/admin/users');
    return res.users;
  },

  async createAdminUser(payload: {
    username: string;
    password: string;
    name?: string;
    role?: 'admin' | 'user';
  }): Promise<User> {
    const res = await request<{ user: User }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.user;
  },

  async setUserDisabledStatus(id: string, disabled: boolean): Promise<User> {
    const res = await request<{ user: User }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ disabled }),
    });
    return res.user;
  },

  async resetUserPassword(id: string, password: string): Promise<void> {
    await request(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  async deleteAdminUser(id: string): Promise<void> {
    await request(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async resetToSetup(): Promise<void> {
    await request('/api/admin/reset-to-setup', {
      method: 'POST',
    });
    setStoredToken(null);
  },
};
