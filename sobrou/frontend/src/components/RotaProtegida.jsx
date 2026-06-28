import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';

export default function RotaProtegida({ children }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0b',
        color: '#a3a3ab',
      }}>
        Carregando...
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/boas-vindas" replace />;
  }

  return children;
}
