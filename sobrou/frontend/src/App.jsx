import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexto/AuthContext';
import RotaProtegida from './components/RotaProtegida';
import RotaPublica from './components/RotaPublica';
import Layout from './components/Layout';
import AssistenteFlutuante from './components/AssistenteFlutuante';
import SplashScreen from './components/SplashScreen';

import BoasVindas from './paginas/auth/BoasVindas';
import Login from './paginas/auth/Login';
import Cadastro from './paginas/auth/Cadastro';
import EsqueciSenha from './paginas/auth/EsqueciSenha';
import RedefinirSenha from './paginas/auth/RedefinirSenha';

import Dashboard from './paginas/Dashboard';
import Receitas from './paginas/Receitas';
import Despesas from './paginas/Despesas';
import PlanejamentoMensal from './paginas/PlanejamentoMensal';
import ProximoSalario from './paginas/ProximoSalario';
import Calendario from './paginas/Calendario';
import Relatorios from './paginas/Relatorios';
import Metas from './paginas/Metas';
import AssistenteIA from './paginas/AssistenteIA';
import Perfil from './paginas/Perfil';
import Sobre from './paginas/Sobre';

import { calcularPerfilComportamental } from './services/perfilComportamental';

function AreaAutenticada({ children }) {
  return (
    <RotaProtegida>
      <Layout>{children}</Layout>
      <AssistenteFlutuante />
    </RotaProtegida>
  );
}

function CalculoDePerfilEmSegundoPlano() {
  const { usuario, autenticado } = useAuth();

  useEffect(() => {
    if (!autenticado || !usuario) return;
    
    calcularPerfilComportamental(usuario.id).catch(() => {});
  }, [autenticado, usuario]);

  return null;
}

function ConteudoApp() {
  const { carregando } = useAuth();
  const [tempoMinimoPassou, setTempoMinimoPassou] = useState(false);

  useEffect(() => {
    const tempo = setTimeout(() => setTempoMinimoPassou(true), 700);
    return () => clearTimeout(tempo);
  }, []);

  
  const mostrarSplash = carregando || !tempoMinimoPassou;

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CalculoDePerfilEmSegundoPlano />
      {mostrarSplash && <SplashScreen />}
      <div style={{ visibility: mostrarSplash ? 'hidden' : 'visible' }}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/boas-vindas" element={<RotaPublica><BoasVindas /></RotaPublica>} />
          <Route path="/login" element={<RotaPublica><Login /></RotaPublica>} />
          <Route path="/cadastro" element={<RotaPublica><Cadastro /></RotaPublica>} />
          <Route path="/esqueci-senha" element={<RotaPublica><EsqueciSenha /></RotaPublica>} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

          {/* Login */}
          <Route path="/" element={<AreaAutenticada><Dashboard /></AreaAutenticada>} />
          <Route path="/receitas" element={<AreaAutenticada><Receitas /></AreaAutenticada>} />
          <Route path="/despesas" element={<AreaAutenticada><Despesas /></AreaAutenticada>} />
          <Route path="/planejamento-mensal" element={<AreaAutenticada><PlanejamentoMensal /></AreaAutenticada>} />
          <Route path="/proximo-salario" element={<AreaAutenticada><ProximoSalario /></AreaAutenticada>} />
          <Route path="/calendario" element={<AreaAutenticada><Calendario /></AreaAutenticada>} />
          <Route path="/relatorios" element={<AreaAutenticada><Relatorios /></AreaAutenticada>} />
          <Route path="/metas" element={<AreaAutenticada><Metas /></AreaAutenticada>} />
          <Route path="/assistente" element={<AreaAutenticada><AssistenteIA /></AreaAutenticada>} />
          <Route path="/perfil" element={<AreaAutenticada><Perfil /></AreaAutenticada>} />
          <Route path="/sobre" element={<AreaAutenticada><Sobre /></AreaAutenticada>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConteudoApp />
    </AuthProvider>
  );
}
