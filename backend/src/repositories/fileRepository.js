const fs = require('node:fs/promises');
const path = require('node:path');

function createFileRepository(storageDir) {
  return {
    getPath(id) {
      return path.join(storageDir, id);
    },

    async exists(id) {
      try {
        return (await fs.stat(path.join(storageDir, id))).isFile();
      } catch (error) {
        if (error.code === 'ENOENT') {
          return false;
        }
        throw error;
      }
    },

    async remove(id) {
      try {
        await fs.unlink(path.join(storageDir, id));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    },
  };
}

module.exports = { createFileRepository };