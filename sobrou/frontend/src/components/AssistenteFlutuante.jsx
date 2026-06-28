import { useNavigate, useLocation } from 'react-router-dom';
import './AssistenteFlutuante.css';

export default function AssistenteFlutuante() {
  const navigate = useNavigate();
  const location = useLocation();

  // Não mostra o botão flutuante quando já está dentro do próprio Assistente
  if (location.pathname === '/assistente') return null;

  return (
    <button
      className="assistente-botao"
      onClick={() => navigate('/assistente')}
      aria-label="Abrir assistente financeiro"
    >
      ✨
    </button>
  );
}
