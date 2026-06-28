import LogoMarca from '../components/LogoMarca';
import Card from '../components/Card';
import './Sobre.css';

export default function Sobre() {
  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Sobre o Sobrou</h1>
          <p>Conheça um pouco mais sobre o aplicativo</p>
        </div>
      </header>

      <Card>
        <div className="sobre-marca">
          <LogoMarca tamanho="medio" />
          <span className="sobre-slogan">"Visualize, planeje e economize."</span>
        </div>

        <p className="sobre-texto">
          O <strong>Sobrou</strong> é um aplicativo de planejamento financeiro pessoal pensado para
          tornar a gestão do seu dinheiro simples e visual. Em vez de planilhas complicadas, você
          acompanha seu saldo, suas contas e suas metas em tempo real — e entende, em segundos,
          para onde o seu dinheiro está indo.
        </p>

        <ul className="sobre-lista-recursos">
          <li>💰 Controle de receitas e despesas com prioridades</li>
          <li>📊 Relatórios visuais de gastos por categoria</li>
          <li>🎯 Metas financeiras com acompanhamento de progresso</li>
          <li>📅 Calendário financeiro mensal</li>
          <li>⏵ Planejamento do próximo salário antes mesmo de recebê-lo</li>
          <li>✨ Assistente Financeiro com Inteligência Artificial</li>
        </ul>
      </Card>

      <Card titulo="Privacidade e segurança">
        <p className="sobre-texto">
          Seus dados financeiros são individuais e protegidos: cada conta só tem acesso às suas
          próprias informações. Nenhum outro usuário pode visualizar seus dados.
        </p>
      </Card>
    </div>
  );
}
