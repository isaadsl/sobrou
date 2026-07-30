import { usuarioIdDoToken } from '../services/supabaseAdmin.js';

export async function exigirUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    req.userId = await usuarioIdDoToken(token);
    next();
  } catch (erro) {
    res.status(401).json({ erro: 'Não autenticado' });
  }
}