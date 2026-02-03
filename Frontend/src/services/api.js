const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const auth = {
  setSession: (user, token) => {
    localStorage.setItem('upstack_user', JSON.stringify(user));
    localStorage.setItem('upstack_token', token);
  },
  logout: () => {
    localStorage.removeItem('upstack_user');
    localStorage.removeItem('upstack_token');
  },
  getUser: () => {
    const user = localStorage.getItem('upstack_user');
    return user ? JSON.parse(user) : null;
  },
  getToken: () => {
    return localStorage.getItem('upstack_token');
  },
  register: async (email, password, name) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Registration failed');
    }
    const data = await res.json();
    auth.setSession(data.user, data.token);
    return data;
  },
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Login failed');
    }
    const data = await res.json();
    auth.setSession(data.user, data.token);
    return data;
  }
};

const getHeaders = () => {
  const token = auth.getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

export const api = {
  listFiles: async () => {
    const res = await fetch(`${API_URL}/files`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  checkChunks: async (hashes) => {
    const res = await fetch(`${API_URL}/files/check_chunks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(hashes)
    });
    if (!res.ok) throw new Error('Check chunks failed');
    return res.json();
  },

  uploadChunk: async (hash, blob) => {
    const headers = getHeaders();
    headers['Content-Type'] = 'application/octet-stream';

    const res = await fetch(`${API_URL}/files/upload_chunk?hash=${hash}`, {
      method: 'POST',
      headers: headers,
      body: blob
    });
    if (!res.ok) throw new Error('Upload chunk failed');
    return res;
  },

  commitMetadata: async (metadata) => {
    const res = await fetch(`${API_URL}/files/metadata`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(metadata)
    });
    if (!res.ok) throw new Error('Commit metadata failed');
    return res.json();
  },

  downloadChunk: async (hash) => {
    const res = await fetch(`${API_URL}/files/download_chunk?hash=${hash}`, {
      headers: { 'Authorization': `Bearer ${auth.getToken()}` }
    });
    if (!res.ok) throw new Error('Download chunk failed');
    return res.blob();
  },

  share: async (fileId, shareEmail) => {
    const res = await fetch(`${API_URL}/files/share`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id: fileId, share_with: shareEmail })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Share failed');
    }
    return true;
  }
};

// Utils for hashing (crypto.subtle)
export const computeFileHash = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const computeChunkHash = async (chunkBlob) => {
  const buffer = await chunkBlob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
