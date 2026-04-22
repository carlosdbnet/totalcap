import { useState, useRef } from 'react';
import { Plug2, Upload, FileSpreadsheet, Database, MapPin, Ruler, PenTool, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [statusImportacao, setStatusImportacao] = useState<StatusImportacao>('idle');
  const [mensagem, setMensagem] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const salvarDados = async (endpoint: string, dados: any): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro API:', response.status, errorText);
      }
      return response.ok;
    } catch (error) {
      console.error('Erro fetch:', error);
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

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !tabelaSelecionada) return;

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

  return (
    <div className="integracao-container">
      <header className="page-header">
        <h1 className="title">
          <Plug2 size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Integração
        </h1>
        <p className="text-muted">Gerencie as integrações do sistema com fontes externas.</p>
      </header>

      <div className="integracao-grid">
        <div className="glass-panel integracao-card importacao-panel">
          <div className="importacao-header">
            <Upload size={24} />
            <h3>Importação</h3>
          </div>
          
          <div className="importacao-form">
            <label htmlFor="tabela">Selecione a tabela para importação:</label>
            <select
              id="tabela"
              className="form-select"
              value={tabelaSelecionada}
              onChange={(e) => {
                setTabelaSelecionada(e.target.value);
                setStatusImportacao('idle');
                setMensagem('');
              }}
            >
              <option value="">Selecione...</option>
              {TABELAS.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportarExcel}
              style={{ display: 'none' }}
            />

            <button 
              className="btn-primary" 
              onClick={handleBotaoClick}
              disabled={statusImportacao === 'loading'}
            >
              {statusImportacao === 'loading' ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Importando...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={18} />
                  Importar Excel
                </>
              )}
            </button>

            {mensagem && (
              <div className={`mensagem-importacao ${statusImportacao}`}>
                {statusImportacao === 'success' && <CheckCircle size={18} />}
                {statusImportacao === 'error' && <AlertCircle size={18} />}
                <span>{mensagem}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
