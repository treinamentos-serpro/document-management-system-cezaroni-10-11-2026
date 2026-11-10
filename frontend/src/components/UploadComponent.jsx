import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';
import { formatFileSize } from '../utils/formatFileSize.js';

export default function UploadComponent({ onUploadSuccess }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  function selectFile(file) {
    if (file) {
      setSelectedFile(file);
      setMessage(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setMessage(null);
    try {
      const document = await uploadDocument(selectedFile);
      onUploadSuccess(document);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage({ type: 'success', text: 'Documento enviado.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="upload-copy">
        <p className="eyebrow">ADICIONAR AO ESPAÇO</p>
        <h2 id="upload-title">Envie um documento</h2>
        <p>Selecione um arquivo para guardar na sua biblioteca.</p>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label
          className={`drop-zone${isDragging ? ' is-dragging' : ''}${selectedFile ? ' has-file' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            onChange={(event) => selectFile(event.target.files[0])}
          />
          <span className="upload-symbol" aria-hidden="true">+</span>
          <span className="drop-zone-text">
            <strong>{selectedFile ? selectedFile.name : 'Escolher arquivo'}</strong>
            <span>
              {selectedFile
                ? formatFileSize(selectedFile.size)
                : 'ou arraste e solte aqui'}
            </span>
          </span>
          <span className="file-type-note">Qualquer tipo de arquivo</span>
        </label>
        <div className="upload-actions">
          <span className="upload-status" role="status" aria-live="polite">
            {message && (
              <span className={`status-message ${message.type}`}>{message.text}</span>
            )}
          </span>
          <button className="primary-button" type="submit" disabled={!selectedFile || isUploading}>
            {isUploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </div>
      </form>
    </section>
  );
}