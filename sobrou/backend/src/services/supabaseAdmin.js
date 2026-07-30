import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Client "anon" — usado só para validar o token/sessão do usuário
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Client "service_role" — usado para operações administrativas no backend
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function usuarioIdDoToken(token) {
  if (!token) throw new Error('Token de autenticação ausente');
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) throw new Error('Usuário não autenticado');
  return data.user.id;
}

export default supabaseAdmin;