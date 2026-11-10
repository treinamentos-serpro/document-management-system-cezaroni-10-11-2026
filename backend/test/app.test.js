const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.equal(typeof app, 'function', 'o app Express deve ser uma função');
});

async function startTestServer(t) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = app.createApp({ storageDir }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  return `http://127.0.0.1:${server.address().port}`;
}

async function uploadFile(baseUrl, { content, name, owner = 'local' }) {
  const form = new FormData();
  form.append('file', new Blob([content]), name);
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });
}

test('POST /upload grava o arquivo e retorna seus metadados', async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await uploadFile(baseUrl, {
    content: 'conteudo do documento',
    name: 'relatorio.txt',
    owner: 'alice',
  });

  assert.equal(response.status, 201);
  const { document } = await response.json();
  assert.match(document.id, /^[0-9a-f-]{36}$/i);
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, 21);
  assert.equal(document.owner, 'alice');
  assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
});

test('GET /documents lista somente os documentos do usuário', async (t) => {
  const baseUrl = await startTestServer(t);
  const uploadAlice = await uploadFile(baseUrl, {
    content: 'documento alice',
    name: 'alice.txt',
    owner: 'alice',
  });
  const uploadBob = await uploadFile(baseUrl, {
    content: 'documento bob',
    name: 'bob.txt',
    owner: 'bob',
  });
  assert.equal(uploadAlice.status, 201);
  assert.equal(uploadBob.status, 201);

  const aliceResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'alice' },
  });
  const { documents } = await aliceResponse.json();

  assert.equal(aliceResponse.status, 200);
  assert.equal(documents.length, 1);
  assert.equal(documents[0].originalName, 'alice.txt');
  assert.equal(documents[0].owner, 'alice');
});

test('GET /documents/:id/download transmite o arquivo e oculta documentos de outros usuários', async (t) => {
  const baseUrl = await startTestServer(t);
  const uploadResponse = await uploadFile(baseUrl, {
    content: 'arquivo para download',
    name: 'arquivo.txt',
    owner: 'alice',
  });
  const { document } = await uploadResponse.json();

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'alice' } }
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'arquivo para download');
  assert.match(downloadResponse.headers.get('content-disposition'), /filename="arquivo.txt"/);

  const otherOwnerResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'bob' } }
  );
  assert.equal(otherOwnerResponse.status, 404);
  assert.equal((await otherOwnerResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
