import './Card.css';

export default function Card({ titulo, acao, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(titulo || acao) && (
        <div className="card-cabecalho">
          {titulo && <h3 className="card-titulo">{titulo}</h3>}
          {acao}
        </div>
      )}
      <div className="card-corpo">{children}</div>
    </div>
  );
}
