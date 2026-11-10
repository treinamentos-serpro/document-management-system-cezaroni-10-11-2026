import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/formatFileSize.js';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  if (isLoading && documents.length === 0) {
    return <p className="list-feedback">Carregando documentos...</p>;
  }

  if (error && documents.length === 0) {
    return (
      <div className="list-feedback error-panel" role="alert">
        <p>{error}</p>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">0</span>
        <div>
          <h3>Nenhum documento ainda</h3>
          <p>Os arquivos enviados aparecerão aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="document-table-wrap">
        <table className="document-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Tamanho</th>
              <th scope="col">Enviado em</th>
              <th scope="col"><span className="visually-hidden">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="document-name-cell">
                  <span className="file-mark" aria-hidden="true">DOC</span>
                  <span className="document-name" title={document.originalName}>
                    {document.originalName}
                  </span>
                </td>
                <td data-label="Tamanho">{formatFileSize(document.size)}</td>
                <td data-label="Enviado em">{formatDate(document.uploadedAt)}</td>
                <td className="document-action-cell">
                  <DownloadButton document={document} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}