import { useCallback, useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');

  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setListError('');
    try {
      const nextDocuments = await listDocuments();
      setDocuments(nextDocuments);
    } catch (error) {
      setListError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  function handleUploadSuccess(document) {
    setDocuments((currentDocuments) =>
      [document, ...currentDocuments.filter((item) => item.id !== document.id)].sort(
        (left, right) => right.uploadedAt.localeCompare(left.uploadedAt)
      )
    );
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>arquivo<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-meta">
          <span className="connection-indicator" aria-hidden="true" />
          <span>Espaço local</span>
        </div>
      </header>

      <div className="content">
        <section className="page-heading" aria-labelledby="page-title">
          <p className="eyebrow">DOCUMENTOS / BIBLIOTECA</p>
          <div className="heading-row">
            <div>
              <h1 id="page-title">Seus documentos</h1>
              <p className="page-description">Arquivos enviados para este espaço de trabalho.</p>
            </div>
            <span className="document-count" aria-live="polite">
              {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
            </span>
          </div>
        </section>

        <UploadComponent onUploadSuccess={handleUploadSuccess} />

        <section className="library-section" aria-labelledby="library-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ARQUIVOS</p>
              <h2 id="library-title">Biblioteca</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={refreshDocuments}
              disabled={isLoading}
            >
              {isLoading ? 'Atualizando...' : 'Atualizar lista'}
            </button>
          </div>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={listError}
            onRetry={refreshDocuments}
          />
        </section>
      </div>
      <footer className="page-footer">
        <span>ARQUIVO<span className="brand-period">.</span></span>
        <span>Armazenamento local</span>
      </footer>
    </main>
  );
}
