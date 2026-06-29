import { useEffect } from 'react';
import './Modal.css';

export default function Modal({ aberto, titulo, onFechar, children }) {
  useEffect(() => {
    function aoApertarEsc(e) {
      if (e.key === 'Escape') onFechar();
    }
    if (aberto) document.addEventListener('keydown', aoApertarEsc);
    return () => document.removeEventListener('keydown', aoApertarEsc);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecalho">
          <h3>{titulo}</h3>
          <button className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="modal-corpo">{children}</div>
      </div>
    </div>
  );
}
