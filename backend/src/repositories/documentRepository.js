function createDocumentRepository() {
  const documentsById = new Map();

  return {
    async save(document) {
      documentsById.set(document.id, document);
      return document;
    },

    async findById(id) {
      return documentsById.get(id) ?? null;
    },

    async findByOwner(owner) {
      return [...documentsById.values()]
        .filter((document) => document.owner === owner)
        .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
    },
  };
}

module.exports = { createDocumentRepository };