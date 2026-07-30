import { useEffect, useState } from 'react';
import { PluggyConnect } from 'react-pluggy-connect';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { obterConnectToken, conectarConta, sincronizarConta, listarContasBancarias } from '../services/pluggy';
import { importarArquivoExtrato } from '../services/importarExtrato';
import { formatarMoeda, formatarDataExtensa } from '../utils/formatadores';
import { useAuth } from '../contexto/AuthContext';
import '../styles/formularios.css';
import './ContasBancarias.css';

export default function ContasBancarias() {
  const { carregando: carregandoAuth } = useAuth();
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [connectToken, setConnectToken] = useState(null);
  const [widgetAberto, setWidgetAberto] = useState(false);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [sincronizandoId, setSincronizandoId] = useState(null);

  useEffect(() => {
    if (carregandoAuth) return;
    carregarContas();
  }, [carregandoAuth]);

  async function carregarContas() {
    setCarregando(true);
    try {
      const dados = await listarContasBancarias();
      setContas(dados);
    } catch {
      setMensagemErro('Não foi possível carregar suas contas bancárias.');
    } finally {
      setCarregando(false);
    }
  }

  async function abrirConectarBanco() {
    setMensagemErro('');
    try {
      const token = await obterConnectToken();
      setConnectToken(token);
      setWidgetAberto(true);
    } catch {
      setMensagemErro('Não foi possível iniciar a conexão com o banco. Tente novamente.');
    }
  }

  async function aoConectarComSucesso(itemData) {
    setWidgetAberto(false);
    setProcessando(true);
    try {
      await conectarConta(itemData.item.id);
      setMensagemSucesso('Conta conectada e sincronizada com sucesso!');
      await carregarContas();
    } catch {
      setMensagemErro('A conexão foi feita, mas houve um erro ao sincronizar os dados.');
    } finally {
      setProcessando(false);
    }
  }

  async function sincronizar(contaId) {
    setMensagemErro('');
    setSincronizandoId(contaId);
    try {
      await sincronizarConta(contaId);
      setMensagemSucesso('Sincronização concluída.');
      await carregarContas();
    } catch {
      setMensagemErro('Falha ao sincronizar. Tente novamente em instantes.');
    } finally {
      setSincronizandoId(null);
    }
  }

  async function enviarImportacao(e) {
    e.preventDefault();
    if (!arquivo) return;

    setProcessando(true);
    setMensagemErro('');
    try {
      const resultado = await importarArquivoExtrato(arquivo);
      setMensagemSucesso(
        `Importação concluída: ${resultado.receitas_importadas} recebimento(s) e ${resultado.despesas_importadas} despesa(s) adicionados${
          resultado.duplicadas > 0 ? ` (${resultado.duplicadas} já existiam)` : ''
        }.`
      );
      setModalImportarAberto(false);
      setArquivo(null);
    } catch (erro) {
      setMensagemErro(erro.message || 'Erro ao importar o arquivo.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Contas Bancárias</h1>
          <p>Conecte seu banco ou importe um extrato para trazer suas transações automaticamente</p>
        </div>
        <div className="contas-acoes-cabecalho">
          <button className="botao botao-secundario" onClick={() => setModalImportarAberto(true)}>
            Importar Extrato
          </button>
          <button className="botao botao-primario" onClick={abrirConectarBanco}>
            + Conectar Banco
          </button>
        </div>
      </header>

      {mensagemErro && <div className="assistente-balao-erro contas-mensagem">{mensagemErro}</div>}
      {mensagemSucesso && <div className="contas-mensagem-sucesso">{mensagemSucesso}</div>}

      {carregando ? (
        <p className="pagina-vazio">Carregando...</p>
      ) : contas.length === 0 ? (
        <Card>
          <p className="pagina-vazio">
            Nenhuma conta conectada ainda. Use "Conectar Banco" para sincronizar automaticamente, ou "Importar Extrato"
            para subir um arquivo OFX, CSV ou XLSX.
          </p>
        </Card>
      ) : (
        <div className="contas-grade">
          {contas.map((conta) => (
            <Card key={conta.id} className="conta-card">
              <div className="conta-cabecalho">
                <span className="conta-instituicao">{conta.instituicao}</span>
                <span className="valor-monetario">{formatarMoeda(conta.saldo)}</span>
              </div>
              <p className="conta-sincronizacao">
                {conta.ultima_sincronizacao
                  ? `Última sincronização: ${formatarDataExtensa(conta.ultima_sincronizacao.slice(0, 10))}`
                  : 'Ainda não sincronizado'}
              </p>
              <button
                className="botao botao-secundario"
                onClick={() => sincronizar(conta.id)}
                disabled={sincronizandoId === conta.id}
              >
                {sincronizandoId === conta.id ? 'Sincronizando...' : 'Sincronizar agora'}
              </button>
            </Card>
          ))}
        </div>
      )}

      {widgetAberto && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={aoConectarComSucesso}
          onError={() => setMensagemErro('Falha na conexão com o banco.')}
          onClose={() => setWidgetAberto(false)}
        />
      )}

      <Modal
        aberto={modalImportarAberto}
        titulo="Importar Extrato"
        onFechar={() => setModalImportarAberto(false)}
      >
        <form onSubmit={enviarImportacao}>
          <div className="form-campo">
            <label>Arquivo (.ofx, .csv ou .xlsx)</label>
            <input
              type="file"
              accept=".ofx,.csv,.xlsx"
              onChange={(e) => setArquivo(e.target.files[0])}
              required
            />
          </div>
          <div className="form-acoes">
            <button type="button" className="botao botao-secundario" onClick={() => setModalImportarAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario" disabled={processando}>
              {processando ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}