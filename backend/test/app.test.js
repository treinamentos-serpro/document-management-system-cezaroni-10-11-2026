const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam o proprietário', async (t) => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const testApp = app.createApp({
    storageDir: temporaryDirectory,
    maxFileSizeBytes: 8,
  });
  const server = testApp.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const form = new FormData();
  form.append('file', new Blob(['hello']), 'hello.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'hello.txt');
  assert.strictEqual(document.size, 5);
  assert.strictEqual(document.owner, 'alice');
  assert.match(document.uploadedAt, /^\d{4}-\d{2}-\d{2}T/);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.deepStrictEqual((await listResponse.json()).documents, [document]);

  const otherOwnerList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.deepStrictEqual((await otherOwnerList.json()).documents, []);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'hello');
  assert.match(downloadResponse.headers.get('content-disposition'), /filename="hello.txt"/);

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.strictEqual(forbiddenDownload.status, 404);
  assert.strictEqual((await forbiddenDownload.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const missingDownload = await fetch(`${baseUrl}/documents/not-found/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.strictEqual(missingDownload.status, 404);
  assert.strictEqual((await missingDownload.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('upload rejeita arquivo ausente, vazio e acima do limite', async (t) => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const testApp = app.createApp({
    storageDir: temporaryDirectory,
    maxFileSizeBytes: 8,
  });
  const server = testApp.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const missingResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.strictEqual(missingResponse.status, 400);
  assert.strictEqual((await missingResponse.json()).error.code, 'FILE_REQUIRED');

  const emptyForm = new FormData();
  emptyForm.append('file', new Blob([]), 'empty.txt');
  const emptyResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: emptyForm,
  });
  assert.strictEqual(emptyResponse.status, 400);
  assert.strictEqual((await emptyResponse.json()).error.code, 'FILE_EMPTY');

  const largeForm = new FormData();
  largeForm.append('file', new Blob(['123456789']), 'large.txt');
  const largeResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: largeForm,
  });
  assert.strictEqual(largeResponse.status, 413);
  assert.strictEqual((await largeResponse.json()).error.code, 'FILE_TOO_LARGE');

  assert.deepStrictEqual(await fs.readdir(temporaryDirectory), []);
});
