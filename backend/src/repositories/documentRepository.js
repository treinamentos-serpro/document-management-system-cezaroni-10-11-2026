function createDocumentRepository() {
  const documentsById = new Map();

  return {
    async save(document) {
      if (documentsById.has(document.id)) {
        throw new Error('Identificador de documento duplicado.');
      }
      documentsById.set(document.id, document);
      return document;
    },

    async findById(id) {
      return documentsById.get(id) ?? null;
    },

    async findByOwner(owner) {
      return [...documentsById.values()]
        .filter((document) => document.owner === owner)
        .sort((left, right) => {
          const dateOrder = right.uploadedAt.localeCompare(left.uploadedAt);
          return dateOrder || left.id.localeCompare(right.id);
        });
    },
  };
}

module.exports = { createDocumentRepository };