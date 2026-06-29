import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

function urlPublica(rota = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${base}${rota}`;
}

function urlTemRetornoDeAuth() {
  return typeof window !== 'undefined' && /access_token|refresh_token|error=|type=recovery/.test(window.location.hash);
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [processandoRetornoAuth, setProcessandoRetornoAuth] = useState(urlTemRetornoDeAuth());

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      setUsuario(novaSessao?.user ?? null);
      setCarregando(false);
      setProcessandoRetornoAuth(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario) {
      setPerfil(null);
      return;
    }
    buscarPerfil();
  }, [usuario]);

  async function buscarPerfil() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', usuario.id)
      .single();

    if (!error) setPerfil(data);
  }

  async function cadastrar({ nome, email, telefone, senha }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, telefone },
        emailRedirectTo: urlPublica('/'),
      },
    });
    return { data, error };
  }

  async function entrarComEmail({ email, senha }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    return { data, error };
  }

  async function recuperarSenha(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: urlPublica('/redefinir-senha'),
    });
    return { data, error };
  }

  async function atualizarSenha(novaSenha) {
    const { data, error } = await supabase.auth.updateUser({ password: novaSenha });
    return { data, error };
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  async function atualizarPerfil(campos) {
    const { data, error } = await supabase
      .from('profiles')
      .update(campos)
      .eq('id', usuario.id)
      .select()
      .single();

    if (!error) setPerfil(data);
    return { data, error };
  }

  const valor = {
    sessao,
    usuario,
    perfil,
    carregando: carregando || processandoRetornoAuth,
    autenticado: !!usuario,
    cadastrar,
    entrarComEmail,
    recuperarSenha,
    atualizarSenha,
    sair,
    atualizarPerfil,
    recarregarPerfil: buscarPerfil,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return contexto;
}
