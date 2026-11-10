class DocumentServiceError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function normalizeOwner(owner) {
  if (owner === undefined || owner === null || owner.trim() === '') {
    return 'local';
  }

  const normalizedOwner = owner.trim();
  if (normalizedOwner.length > 100 || /[\u0000-\u001f\u007f]/.test(normalizedOwner)) {
    throw new DocumentServiceError(400, 'INVALID_OWNER', 'O identificador do usuário é inválido.');
  }
  return normalizedOwner;
}

function createDocumentService({ documentRepository, fileRepository }) {
  return {
    async upload({ file, owner }) {
      if (!file) {
        throw new DocumentServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
      }

      try {
        const normalizedOwner = normalizeOwner(owner);
        if (file.size === 0) {
          throw new DocumentServiceError(400, 'FILE_EMPTY', 'O arquivo não pode estar vazio.');
        }

        const document = {
          id: file.filename,
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          owner: normalizedOwner,
        };
        return await documentRepository.save(document);
      } catch (error) {
        await fileRepository.remove(file.filename).catch(() => {});
        throw error;
      }
    },

    async list(owner) {
      return documentRepository.findByOwner(normalizeOwner(owner));
    },

    async getDownload(id, owner) {
      const document = await documentRepository.findById(id);
      if (!document || document.owner !== normalizeOwner(owner)) {
        throw new DocumentServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      if (!(await fileRepository.exists(document.id))) {
        throw new DocumentServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      return { document, filePath: fileRepository.getPath(document.id) };
    },
  };
}

module.exports = { createDocumentService };