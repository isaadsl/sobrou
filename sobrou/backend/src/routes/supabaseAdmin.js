import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function usuarioIdDoToken(token) {
  if (!token) throw new Error('Token de autenticação ausente');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new Error('Usuário não autenticado');
  return data.user.id;
}

export default supabaseAdmin;