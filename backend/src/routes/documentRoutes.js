const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');

function createDocumentRouter({ controller, storageDir, maxFileSizeBytes }) {
  const router = express.Router();
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, callback) {
        fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
      },
      filename(req, file, callback) {
        callback(null, randomUUID());
      },
    }),
    limits: { fileSize: maxFileSizeBytes, files: 1 },
  });

  function parseUpload(req, res, next) {
    upload.single('file')(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (!(error instanceof multer.MulterError)) {
        return next(error);
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        error.statusCode = 413;
        error.code = 'FILE_TOO_LARGE';
        error.message = 'O arquivo excede o tamanho máximo permitido.';
      } else {
        error.statusCode = 400;
        error.code = 'INVALID_UPLOAD';
        error.message = 'A requisição de upload é inválida.';
      }
      next(error);
    });
  }

  router.post('/upload', parseUpload, controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRouter };