const path = require('node:path');

function createDocumentController({ documentService }) {
  return {
    async upload(req, res) {
      const document = await documentService.upload({
        file: req.file,
        owner: req.get('X-User-Id'),
      });
      res.status(201).json({ document });
    },

    async list(req, res) {
      const documents = await documentService.list(req.get('X-User-Id'));
      res.json({ documents });
    },

    async download(req, res, next) {
      const { document, filePath } = await documentService.getDownload(
        req.params.id,
        req.get('X-User-Id')
      );
      const downloadName = path
        .basename(document.originalName.replace(/\\/g, '/'))
        .replace(/[\u0000-\u001f\u007f]/g, '') || 'document';

      res.type('application/octet-stream');
      res.download(filePath, downloadName, (error) => {
        if (error) {
          next(error);
        }
      });
    },
  };
}

module.exports = { createDocumentController };