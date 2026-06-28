const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('momo_token');
}

function buildHeaders(extra = {}) {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(res) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.error || text;
  } catch {
    return text || 'Request failed';
  }
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export { getToken };
