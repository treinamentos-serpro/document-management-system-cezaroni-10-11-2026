const path = require('node:path');
const express = require('express');
const { createDocumentRepository } = require('./repositories/documentRepository');
const { createFileRepository } = require('./repositories/fileRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRouter } = require('./routes/documentRoutes');

function parseMaxFileSize(value) {
  const maxFileSizeBytes = Number(value ?? 10 * 1024 * 1024);
  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }
  return maxFileSizeBytes;
}

function createApp(options = {}) {
  const storageDir = path.resolve(
    __dirname,
    '..',
    options.storageDir ?? process.env.STORAGE_DIR ?? 'storage'
  );
  const maxFileSizeBytes = parseMaxFileSize(
    options.maxFileSizeBytes ?? process.env.MAX_FILE_SIZE_BYTES
  );
  const documentRepository = createDocumentRepository();
  const fileRepository = createFileRepository(storageDir);
  const documentService = createDocumentService({ documentRepository, fileRepository });
  const documentController = createDocumentController({ documentService });
  const documentRouter = createDocumentRouter({
    controller: documentController,
    storageDir,
    maxFileSizeBytes,
  });

  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(documentRouter);
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: statusCode === 500 ? 'Ocorreu um erro interno.' : error.message,
      },
    });
  });

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => {
    console.log(`DMS backend ouvindo na porta ${port}`);
  });
}

const app = createApp();
app.createApp = createApp;

module.exports = app;
