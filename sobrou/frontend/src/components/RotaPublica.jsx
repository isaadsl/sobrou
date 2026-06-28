import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';

export default function RotaPublica({ children }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) return null;

  if (autenticado) {
    return <Navigate to="/" replace />;
  }

  return children;
}
