import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import './Layout.css';

const ITENS_PRINCIPAIS = [
  { caminho: '/', rotulo: 'Painel', icone: '◆' },
  { caminho: '/despesas', rotulo: 'Despesas', icone: '↓' },
  { caminho: '/proximo-salario', rotulo: 'Próx. Salário', icone: '📉' },
  { caminho: '/assistente', rotulo: 'Assistente', icone: '💬' },
];

const ITENS_SECUNDARIOS = [
  { caminho: '/receitas', rotulo: 'Receitas', icone: '↑' },
  { caminho: '/planejamento-mensal', rotulo: 'Planejamento Mensal', icone: '▦' },
  { caminho: '/calendario', rotulo: 'Calendário', icone: '▢' },
  { caminho: '/relatorios', rotulo: 'Relatórios', icone: '▤' },
  { caminho: '/metas', rotulo: 'Metas', icone: '◎' },
];

const TODOS_ITENS = [...ITENS_PRINCIPAIS.slice(0, -1), ...ITENS_SECUNDARIOS, ITENS_PRINCIPAIS[ITENS_PRINCIPAIS.length - 1]];

export default function Layout({ children }) {
  const { perfil } = useAuth();
  const iniciais = (perfil?.nome || '?').charAt(0).toUpperCase();
  const [menuMaisAberto, setMenuMaisAberto] = useState(false);

  return (
    <div className="layout">
      <aside className="layout-barra-lateral">
        <div className="layout-marca">
          <span className="layout-marca-icone">S</span>
          <div className="layout-marca-textos">
            <span className="layout-marca-texto">Sobrou</span>
            <span className="layout-marca-slogan">Visualize, planeje e economize.</span>
          </div>
        </div>

        {/* Navegação completa — usada como está em telas grandes (desktop) */}
        <nav className="layout-nav layout-nav-desktop">
          {TODOS_ITENS.map((item) => (
            <NavLink
              key={item.caminho}
              to={item.caminho}
              className={({ isActive }) =>
                `layout-nav-item ${isActive ? 'layout-nav-item-ativo' : ''}`
              }
              end={item.caminho === '/'}
            >
              <span className="layout-nav-icone">{item.icone}</span>
              <span>{item.rotulo}</span>
            </NavLink>
          ))}
        </nav>

        <div className="layout-rodape">
          <NavLink to="/perfil" className="layout-perfil-link">
            <span className="layout-perfil-avatar">{iniciais}</span>
            <span className="layout-perfil-nome">{perfil?.nome || 'Meu perfil'}</span>
          </NavLink>
          <NavLink to="/sobre" className="layout-link-sobre">Sobre o Sobrou</NavLink>
        </div>
      </aside>

      <main className="layout-conteudo">{children}</main>

      {/* Barra de navegação inferior fixa — só aparece em mobile (ver CSS) */}
      <nav className="layout-nav-mobile">
        {ITENS_PRINCIPAIS.map((item) => (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            className={({ isActive }) =>
              `layout-nav-item ${isActive ? 'layout-nav-item-ativo' : ''}`
            }
            end={item.caminho === '/'}
          >
            <span className="layout-nav-icone">{item.icone}</span>
            <span>{item.rotulo}</span>
          </NavLink>
        ))}
        <button
          className={`layout-nav-item layout-nav-item-botao ${menuMaisAberto ? 'layout-nav-item-ativo' : ''}`}
          onClick={() => setMenuMaisAberto((v) => !v)}
        >
          <span className="layout-nav-icone">☰</span>
          <span>Mais</span>
        </button>
      </nav>

      {menuMaisAberto && (
        <div className="layout-mais-fundo" onClick={() => setMenuMaisAberto(false)}>
          <div className="layout-mais-painel" onClick={(e) => e.stopPropagation()}>
            <NavLink to="/perfil" className="layout-mais-item" onClick={() => setMenuMaisAberto(false)}>
              <span className="layout-perfil-avatar">{iniciais}</span>
              <span>{perfil?.nome || 'Meu perfil'}</span>
            </NavLink>
            {ITENS_SECUNDARIOS.map((item) => (
              <NavLink
                key={item.caminho}
                to={item.caminho}
                className="layout-mais-item"
                onClick={() => setMenuMaisAberto(false)}
              >
                <span className="layout-nav-icone">{item.icone}</span>
                <span>{item.rotulo}</span>
              </NavLink>
            ))}
            <NavLink to="/sobre" className="layout-mais-item" onClick={() => setMenuMaisAberto(false)}>
              <span className="layout-nav-icone">ⓘ</span>
              <span>Sobre o Sobrou</span>
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
}
