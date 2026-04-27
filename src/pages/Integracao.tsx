import React, { useState, useRef } from 'react';
import { Plug2, Upload, FileSpreadsheet, Database, MapPin, Ruler, PenTool, Loader2, CheckCircle, AlertCircle, Download, Search, Info } from 'lucide-react';
import api from '../lib/api';
import * as XLSX from 'xlsx';
import './Integracao.css';

const TABELAS = [
  { value: 'medidas', label: 'Medidas', icon: Ruler },
  { value: 'desenhos', label: 'Desenho', icon: PenTool },
  { value: 'cidades', label: 'Cidade', icon: MapPin },
  { value: 'estados', label: 'Estado', icon: Database },
  { value: 'contatos', label: 'Contato', icon: Upload },
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
    };

    const campos = mapeamentos[tabela] || [];
    const primeiroRegistro = dados[0] || {};
    const chaves = Object.keys(primeiroRegistro);

    const encontrarCampo = (padroes: string[]) => {
      for (const padrao of padroes) {
        const encontrado = chaves.find(c => 
          normalizarNome(c).includes(normalizarNome(padrao)) || 
          normalizarNome(padrao).includes(normalizarNome(c))
        );
        if (encontrado) return encontrado;
      }
      return chaves[0];
    };

    const campoPrincipal = encontrarCampo(campos);
    
    // Se não encontrou campo pré-definido, tenta mapear as chaves originais para chaves amigáveis ao banco
    if (!mapeamentos[tabela]) {
      return dados.map(row => {
        const item: any = { ativo: true };
        Object.keys(row).forEach(key => {
          const keyLimpa = normalizarNome(key);
          // Mapeamento dinâmico básico
          if (keyLimpa === 'descricao' || keyLimpa === 'desc' || keyLimpa === 'nome') item.descricao = row[key];
          else if (keyLimpa === 'medida') item.medida = row[key];
          else if (keyLimpa === 'banda') item.banda = row[key];
          else if (keyLimpa === 'valor' || keyLimpa === 'preco') item.valor = row[key];
          else item[keyLimpa] = row[key]; // Tenta usar o nome da coluna original em minúsculo
        });
        return item;
      });
    }

    if (!campoPrincipal) return [];

    return dados.map((row) => {
      const valor = row[campoPrincipal];
      if (!valor) return null;

      const item: any = { ativo: true };

      if (tabela === 'cidades') {
        item.nome = valor.toString();
        item.uf = '';
      } else if (tabela === 'estados') {
        item.uf = valor.toString().substring(0, 2);
        item.nome = valor.toString();
      } else if (tabela === 'contatos') {
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
        
        const rg = findField(['rg']);
        if (rg) item.rg = row[rg]?.toString() || '';
        
        const ie = findField(['insc', 'estadual']);
        if (ie) item.inscestadual = row[ie]?.toString() || '';
        
        const im = findField(['municipal', 'inscmunicipio']);
        if (im) item.inscmunicipio = row[im]?.toString() || '';
        
        const contatoCom = findField(['contato', 'comercial']);
        if (contatoCom) item.contato_comercial = row[contatoCom]?.toString() || '';
        
        const contatoFin = findField(['financeiro']);
        if (contatoFin) item.contato_financeiro = row[contatoFin]?.toString() || '';
      } else {
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
      // Solicita formato JSON do backend
      const response = await api.get(`/exportacao/dinamica/${tabelaExportar.trim()}?format=json`);
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
                <Database size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ex: medidas, desenhos, produtos..." 
                  style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                  value={tabelaSelecionada}
                  onChange={(e) => setTabelaSelecionada(e.target.value)}
                />
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
                <Database size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ex: produtos, marcas, clientes..." 
                  style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                  value={tabelaExportar}
                  onChange={(e) => setTabelaExportar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExportarDinamico()}
                />
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
