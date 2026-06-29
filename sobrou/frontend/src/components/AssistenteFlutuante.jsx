import { useNavigate, useLocation } from 'react-router-dom';
import './AssistenteFlutuante.css';

export default function AssistenteFlutuante() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/assistente') return null;

  return (
    <button
      className="assistente-botao"
      onClick={() => navigate('/assistente')}
      aria-label="Abrir assistente financeiro"
    >
      💬
    </button>
  );
}
