const API_URL = 'http://localhost:8080/api/v1';

export const auth = {
  login: (userId) => {
    localStorage.setItem('upstack_user_id', userId);
  },
  logout: () => {
    localStorage.removeItem('upstack_user_id');
  },
  getUser: () => {
    return localStorage.getItem('upstack_user_id');
  }
};

const getHeaders = () => {
  const userId = auth.getUser();
  return {
    'X-User-ID': userId || '',
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
    // Binary upload, update content-type
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
      headers: { 'X-User-ID': auth.getUser() } // No json content type
    });
    if (!res.ok) throw new Error('Download chunk failed');
    return res.blob();
  },

  share: async (fileId, userId) => {
    const res = await fetch(`${API_URL}/files/share`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id: fileId, share_with: userId })
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
