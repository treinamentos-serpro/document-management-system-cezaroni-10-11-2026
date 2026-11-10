const API_BASE = '/api';
const OWNER_ID = 'local';

async function readError(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'X-User-Id': OWNER_ID,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  const body = await response.json();
  return body.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();
  return body.document;
}

export async function downloadDocument(document) {
  const response = await request(
    `/documents/${encodeURIComponent(document.id)}/download`
  );
  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.hidden = true;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}