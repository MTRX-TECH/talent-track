const API_BASE = '/api';

export function getToken() { return localStorage.getItem('talenttrack_token'); }
export function setToken(token) { localStorage.setItem('talenttrack_token', token); }
export function removeToken() { localStorage.removeItem('talenttrack_token'); }
export function getTenantId() { return localStorage.getItem('talenttrack_tenant_id') || 'tenant-rit'; }

let isRefreshing = false;

export async function apiFetch(endpoint, options = {}, isRetry = false) {
  const token = getToken();
  const tenantId = getTenantId();

  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 && !isRetry && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': tenantId }
            });
            const refreshData = await refreshRes.json();
            isRefreshing = false;

            if (refreshRes.ok && refreshData.success && refreshData.token) {
              setToken(refreshData.token);
              if (refreshData.user) localStorage.setItem('talenttrack_user', JSON.stringify(refreshData.user));
              return await apiFetch(endpoint, options, true);
            }
          } catch (refreshErr) {
            isRefreshing = false;
          }
        }

        removeToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (err) {
    console.error(`[API ERROR] ${endpoint}:`, err.message);
    throw err;
  }
}
