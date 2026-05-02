import React, { useState, useRef } from 'react';
import { Plug2, Upload, FileSpreadsheet, Database, MapPin, Ruler, PenTool, Loader2, CheckCircle, AlertCircle, Download, Search, Info } from 'lucide-react';
import api from '../lib/api';
import * as XLSX from 'xlsx';
import './Integracao.css';

const TABELAS = [
  { value: 'contatos', label: 'Contatos', icon: Upload, dbTable: 'contato' },
  { value: 'areas', label: 'Areas', icon: Ruler, dbTable: 'area' },
  { value: 'regioes', label: 'Regioes', icon: Ruler, dbTable: 'regiao' },
  { value: 'medidas', label: 'Medidas', icon: Ruler, dbTable: 'medida' },
  { value: 'desenhos', label: 'Desenhos', icon: PenTool, dbTable: 'desenho' },
  { value: 'cidades', label: 'Cidades', icon: MapPin, dbTable: 'cidade' },
  { value: 'estados', label: 'Estados', icon: Database, dbTable: 'estado' },
  { value: 'produtos', label: 'Produtos', icon: Database, dbTable: 'produto' },
  { value: 'marcas', label: 'Marcas', icon: Database, dbTable: 'marca' },
  { value: 'vendedores', label: 'Vendedores', icon: Database, dbTable: 'vendedor' },
  { value: 'setores', label: 'Setores', icon: Database, dbTable: 'setor' },
  { value: 'servicos', label: 'Serviços', icon: Database, dbTable: 'servico' },
  { value: 'bancos', label: 'Bancos', icon: Database, dbTable: 'banco' },
  { value: 'veiculos', label: 'Veículos', icon: Database, dbTable: 'veiculo' },
  { value: 'mobos', label: 'MOBOS', icon: Upload, dbTable: 'mobos' },
  { value: 'mobpneus', label: 'Mobpneus', icon: Database, dbTable: 'mobpneu' },

  { value: 'fatura-laudos', label: 'Fatura Laudos', icon: Database, dbTable: 'fatura_laudo' },
  { value: 'registro-falhas', label: 'Registro Falhas', icon: Database, dbTable: 'registro_falha' },
  { value: 'dispositivos', label: 'Dispositivos', icon: Database, dbTable: 'dispositivos' },
  { value: 'ordem_servico', label: 'Ordem Serviços', icon: Upload, dbTable: 'ordem_servico' },
  { value: 'Pneus', label: 'Pneus', icon: Upload, dbTable: 'Pneu' },



];

type StatusImportacao = 'idle' | 'loading' | 'success' | 'error';

export default function Integracao() {
  const [tabelaSelecionada, setTabelaSelecionada] = useState('');
  const [tabelaExportar, setTabelaExportar] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [statusImportacao, setStatusImportacao] = useState<StatusImportacao>('idle');
  const [statusExportacao, setStatusExportacao] = useState<StatusImportacao>('idle');
  const [mensagem, setMensagem] = useState('');
  const [mensagemExport, setMensagemExport] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const salvarDados = async (endpoint: string, dados: any): Promise<boolean> => {
    try {
      const response = await api.post(endpoint, dados);
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return false;
    }
  };

  const normalizarNome = (nome: string) => nome?.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

  const mapearDados = (dados: any[], tabela: string): any[] => {
    const mapeamentos: Record<string, string[]> = {
      medidas: ['medida', 'Medida', 'Medidas', 'banda', 'Banda'],
      desenhos: ['descricao', 'descrição', 'Desenho', 'desenho', 'Desenho'],
      cidades: ['nome', 'cidade', 'Cidade', 'nomecidade'],
      estados: ['nome', 'estado', 'UF', 'uf', 'Sigla'],
      contatos: ['nome', 'Nome', 'razaosocial', 'Razão Social', 'cpfcnpj', 'cpf', 'cnpj', 'documento'],
      areas: ['nome', 'area', 'Area', 'descricao'],
      regioes: ['nome', 'regiao', 'Regiao', 'descricao'],
      'fatura-laudos': ['valor', 'id_laudo', 'id_fatura'],
      'registro-falhas': ['obs', 'id_falha', 'id_operador', 'id_setor'],
    };

    const campos = mapeamentos[tabela] || [];
    const primeiroRegistro = dados[0] || {};
    const chaves = Object.keys(primeiroRegistro);

    const encontrarCampo = (padroes: string[]) => {
      for (const padrao of padroes) {
        const encontrado = chaves.find(c =>
          normalizarNome(c) === normalizarNome(padrao) ||
          normalizarNome(c).includes(normalizarNome(padrao))
        );
        if (encontrado) return encontrado;
      }
      return null;
    };

    const campoPrincipal = encontrarCampo(campos);

    // Se não encontrou campo pré-definido, tenta mapear as chaves originais para chaves amigáveis ao banco
    if (!mapeamentos[tabela] || (tabela !== 'cidades' && tabela !== 'estados' && tabela !== 'contatos' && tabela !== 'areas')) {
      return dados.map(row => {
        const item: any = { ativo: true };
        Object.keys(row).forEach(key => {
          const keyLimpa = normalizarNome(key);
          // Mapeamento dinâmico básico - Corrigido para não sobrescrever nome/codigo
          if (keyLimpa === 'codigo' || keyLimpa === 'cod') item.codigo = row[key]?.toString();
          else if (keyLimpa === 'nome') item.nome = row[key]?.toString();
          else if (keyLimpa === 'descricao' || keyLimpa === 'desc') item.descricao = row[key]?.toString();
          else if (keyLimpa === 'medida') item.medida = row[key]?.toString();
          else if (keyLimpa === 'banda') item.banda = row[key]?.toString();
          else if (keyLimpa === 'valor' || keyLimpa === 'preco') item.valor = row[key];
          else item[keyLimpa] = row[key];
        });
        return item;
      });
    }

    return dados.map((row) => {
      const valor = row[campoPrincipal || ''];

      const item: any = { ativo: true };

      if (tabela === 'areas' || tabela === 'regioes' || tabela === 'fatura-laudos' || tabela === 'registro-falhas') {
        const findKey = (patterns: string[]) => chaves.find(c => patterns.some(p => normalizarNome(c) === normalizarNome(p)));

        const keyCodigo = findKey(['codigo', 'cod', 'id', 'idarea', 'idregiao']);
        const keyNome = findKey(['nome', 'area', 'regiao', 'descricao', 'desc', 'obs']);

        if (tabela === 'fatura-laudos') {
          item.id_fatura = parseInt(row[findKey(['id_fatura', 'fatura']) || ''] || '0');
          item.id_laudo = parseInt(row[findKey(['id_laudo', 'laudo']) || ''] || '0');
          item.valor = parseFloat(row[findKey(['valor', 'vrtotal', 'preco']) || ''] || '0');
        } else if (tabela === 'registro-falhas') {
          item.id_setor = parseInt(row[findKey(['id_setor', 'setor']) || ''] || '0');
          item.id_operador = parseInt(row[findKey(['id_operador', 'operador']) || ''] || '0');
          item.id_falha = parseInt(row[findKey(['id_falha', 'falha']) || ''] || '0');
          item.id_pneu = parseInt(row[findKey(['id_pneu', 'pneu']) || ''] || '0');
          item.obs = row[findKey(['obs', 'observacao', 'desc']) || '']?.toString() || '';
        } else {
          item.codigo = keyCodigo ? row[keyCodigo]?.toString() : (row[chaves[0]]?.toString() || '0');
          item.nome = keyNome ? row[keyNome]?.toString() : (valor?.toString() || '');
        }

        if (!item.nome && tabela !== 'fatura-laudos' && tabela !== 'registro-falhas') return null;
      } else if (tabela === 'cidades') {
        if (!valor) return null;
        item.nome = valor.toString();
        const ufField = chaves.find(c => normalizarNome(c) === 'uf' || normalizarNome(c) === 'estado' || normalizarNome(c).includes('sigla'));
        item.uf = ufField ? row[ufField]?.toString() : '';
        const ibgeField = chaves.find(c => normalizarNome(c).includes('ibge'));
        if (ibgeField) item.codigoibge = parseInt(row[ibgeField]) || null;
      } else if (tabela === 'estados') {
        if (!valor) return null;
        item.uf = valor.toString().substring(0, 2);
        item.nome = valor.toString();
      } else if (tabela === 'contatos') {
        if (!valor) return null;
        item.nome = valor.toString();

        const cpfCnpj = chaves.find(c =>
          normalizarNome(c).includes('cpf') ||
          normalizarNome(c).includes('cnpj') ||
          normalizarNome(c).includes('documento')
        );
        if (cpfCnpj) item.cpfcnpj = row[cpfCnpj]?.toString() || '';

        const razao = chaves.find(c =>
          normalizarNome(c).includes('razao') || normalizarNome(c).includes('social')
        );
        if (razao) item.razaosocial = row[razao]?.toString() || '';

        const pessoa = chaves.find(c => normalizarNome(c).includes('pessoa'));
        if (pessoa) item.pessoa = row[pessoa]?.toString() || 'F';

        const findField = (keywords: string[]) => chaves.find(c =>
          keywords.some(k => normalizarNome(c).includes(normalizarNome(k)))
        );

        const fone = findField(['telefone', 'fone', 'phone', 'celular', 'cel']);
        if (fone) item.foneprincipal = row[fone]?.toString() || '';

        const email = findField(['email', 'e-mail']);
        if (email) item.email = row[email]?.toString() || '';

        const rua = findField(['rua', 'endereco', 'logradouro', 'address']);
        if (rua) item.rua = row[rua]?.toString() || '';

        const num = findField(['numero', 'num', 'número']);
        if (num) item.numcasa = row[num]?.toString() || '';

        const bairro = findField(['bairro', 'district']);
        if (bairro) item.bairro = row[bairro]?.toString() || '';

        const cep = findField(['cep', 'cep']);
        if (cep) item.cep = row[cep]?.toString() || '';

        const cid = findField(['cidade', 'city']);
        if (cid) item.cidade = row[cid]?.toString() || '';

        const estado = findField(['uf', 'estado', 'state']);
        if (estado) item.uf = row[estado]?.toString() || '';
      } else {
        if (!valor) return null;
        item.descricao = valor.toString();
      }

      return item;
    }).filter(Boolean);
  };

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      setArquivoSelecionado(arquivo);
      setStatusImportacao('idle');
      setMensagem('');
    }
  };

  const handleImportarExcel = async () => {
    if (!arquivoSelecionado || !tabelaSelecionada.trim()) {
      setMensagem('Informe a tabela e selecione um arquivo');
      setStatusImportacao('error');
      return;
    }

    const arquivo = arquivoSelecionado;

    setStatusImportacao('loading');
    setMensagem('Processando arquivo Excel...');

    try {
      const dados = await arquivo.arrayBuffer();
      const workbook = XLSX.read(dados, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const dadosExcel: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (dadosExcel.length === 0) {
        throw new Error('Planilha vazia');
      }

      const dadosNormalizados = mapearDados(dadosExcel, tabelaSelecionada);

      if (dadosNormalizados.length === 0) {
        throw new Error('Não foi possível mapear os dados da planilha');
      }

      const endpoint = `/${tabelaSelecionada}/`;
      let sucesso = 0;
      let falha = 0;

      setMensagem(`Importando ${dadosNormalizados.length} registros...`);

      for (const item of dadosNormalizados) {
        const ok = await salvarDados(endpoint, item);
        if (ok) {
          sucesso++;
        } else {
          falha++;
        }
      }

      if (falha > 0) {
        setStatusImportacao('success');
        setMensagem(`${sucesso} importados, ${falha} falharam`);
      } else {
        setStatusImportacao('success');
        setMensagem(`${sucesso} registros importados com sucesso!`);
      }
    } catch (error) {
      setStatusImportacao('error');
      setMensagem(error instanceof Error ? error.message : 'Erro ao importar arquivo');
    }

    setArquivoSelecionado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBotaoClick = () => {
    if (!tabelaSelecionada) {
      setMensagem('Selecione uma tabela primeiro');
      setStatusImportacao('error');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleExportarDinamico = async () => {
    if (!tabelaExportar.trim()) {
      setMensagemExport('Informe o nome da tabela');
      setStatusExportacao('error');
      return;
    }

    setStatusExportacao('loading');
    setMensagemExport('Preparando exportação Excel...');

    try {
      // Busca o nome real da tabela no banco de dados (geralmente singular)
      const selectedTabela = TABELAS.find(t => t.value === tabelaExportar);
      const tableName = selectedTabela ? selectedTabela.dbTable : tabelaExportar.trim();

      // Solicita formato JSON do backend
      const response = await api.get(`/exportacao/dinamica/${tableName}?format=json`);
      const dados = response.data;

      if (!Array.isArray(dados) || dados.length === 0) {
        throw new Error('Nenhum dado encontrado para esta tabela');
      }

      // Converte JSON para WorkSheet usando a biblioteca XLSX
      const worksheet = XLSX.utils.json_to_sheet(dados);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, tabelaExportar.trim());

      // Gera o arquivo e inicia o download
      XLSX.writeFile(workbook, `export_${tabelaExportar.trim()}_${new Date().getTime()}.xlsx`);

      setStatusExportacao('success');
      setMensagemExport('Exportação XLSX concluída!');
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      setStatusExportacao('error');
      setMensagemExport(error.response?.data?.detail || error.message || 'Erro ao exportar para Excel.');
    }
  };

  return (
    <div className="page-container" style={{ background: '#E5E5E5', minHeight: '100vh' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="header-title-group">
          <Plug2 size={32} className="header-icon" style={{ color: '#3b82f6' }} />
          <div>
            <h1>Integração</h1>
            <p>Gerencie as integrações do sistema com fontes externas</p>
          </div>
        </div>
      </header>

      <div className="integracao-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Card de Importação */}
        <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="importacao-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', color: '#3b82f6' }}>
            <Upload size={28} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Importação de Dados</h3>
          </div>

          <div className="importacao-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: '600', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Tabela de Destino</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Database size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 5 }} />
                <select
                  className="form-input"
                  style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', appearance: 'none' }}
                  value={tabelaSelecionada}
                  onChange={(e) => setTabelaSelecionada(e.target.value)}
                >
                  <option value="">Selecione a tabela de destino...</option>
                  {TABELAS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Search size={16} color="#94a3b8" />
                </div>
              </div>
            </div>

            <div className="file-selection-group">
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleArquivoChange} style={{ display: 'none' }} />
              <button
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', padding: '2rem', borderRadius: '12px', border: '2px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s' }}
              >
                <Upload size={32} />
                <span style={{ fontWeight: 600 }}>{arquivoSelecionado ? 'Trocar Arquivo Excel' : 'Clique para selecionar arquivo .xlsx'}</span>
              </button>

              {arquivoSelecionado && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <FileSpreadsheet size={18} />
                  <strong>Arquivo:</strong> {arquivoSelecionado.name}
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={handleImportarExcel}
              disabled={statusImportacao === 'loading' || !arquivoSelecionado}
              style={{ width: '100%', padding: '1rem', borderRadius: '10px', background: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
              {statusImportacao === 'loading' ? (
                <><Loader2 size={20} className="spinning" /> Importando...</>
              ) : (
                <><CheckCircle size={20} /> Iniciar Processamento</>
              )}
            </button>

            {mensagem && (
              <div style={{ padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', background: statusImportacao === 'error' ? '#fef2f2' : '#f0fdf4', color: statusImportacao === 'error' ? '#ef4444' : '#22c55e', fontSize: '0.9rem', fontWeight: 500 }}>
                {statusImportacao === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {mensagem}
              </div>
            )}
          </div>
        </div>

        {/* Card de Exportação */}
        <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="importacao-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', color: '#8b5cf6' }}>
            <Download size={28} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Exportação de Dados</h3>
          </div>

          <div className="importacao-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: '600', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Tabela de Origem</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Database size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 5 }} />
                <select
                  className="form-input"
                  style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', appearance: 'none' }}
                  value={tabelaExportar}
                  onChange={(e) => setTabelaExportar(e.target.value)}
                >
                  <option value="">Selecione a tabela de origem...</option>
                  {TABELAS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Search size={16} color="#94a3b8" />
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5', display: 'flex', gap: '0.75rem' }}>
              <Info size={20} style={{ flexShrink: 0, color: '#3b82f6' }} />
              Esta ferramenta permite extrair todos os dados de qualquer tabela do banco diretamente para um arquivo Excel (.xlsx).
            </div>

            <button
              className="btn-primary"
              onClick={handleExportarDinamico}
              disabled={statusExportacao === 'loading' || !tabelaExportar}
              style={{ width: '100%', padding: '1rem', borderRadius: '10px', background: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
              {statusExportacao === 'loading' ? (
                <><Loader2 size={20} className="spinning" /> Gerando Arquivo...</>
              ) : (
                <><Download size={20} /> Exportar para Excel</>
              )}
            </button>

            {mensagemExport && (
              <div style={{ padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', background: statusExportacao === 'error' ? '#fef2f2' : '#f0fdf4', color: statusExportacao === 'error' ? '#ef4444' : '#22c55e', fontSize: '0.9rem', fontWeight: 500 }}>
                {statusExportacao === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {mensagemExport}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
