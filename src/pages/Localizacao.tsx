import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Loader2, CheckCircle, AlertCircle, 
  Clock, User, FileText, Package, 
  RefreshCw, DollarSign, Activity, FileCheck, Hash, Layout, Ruler
} from 'lucide-react';
import api from '../lib/api';
import './Localizacao.css';

interface Apontamento {
  id: number;
  id_pneu?: number;
  id_setor?: number;
  desc_setor?: string;
  nome_operador?: string;
  inicio?: string;
  termino?: string;
  tempo?: number;
  status?: string;
  obs?: string;
}

interface PneuInfo {
  id: number;
  id_contato?: number;
  numserie: string;
  numfogo: string;
  dot: string;
  datalan: string;
  medida: string;
  marca: string;
  desenho: string;
  tiporecap: string;
  statuspro: string;
  statusfat: string;
  numos: string | number;
  qservico: number;
  vrservico: number;
  vendedor: string;
  cliente: string;
}

export default function Localizacao() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>();
  const [searchSuccess, setSearchSuccess] = useState(false);
  
  const [pneuInfo, setPneuInfo] = useState<PneuInfo | null>(null);
  const [historico, setHistorico] = useState<Apontamento[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      handleReset();
      return;
    }

    const timer = setTimeout(async () => {
      const searchNum = parseInt(searchTerm);
      if (isNaN(searchNum)) {
        setSearchError('Informe um número de ID válido');
        setSearchSuccess(false);
        return;
      }

      setSearchLoading(true);
      setSearchError(undefined);
      
      try {
        const pneuRes = await api.get(`/localizacao/pneu/${searchNum}`);
        
        if (pneuRes.data) {
          const pneData = pneuRes.data;
          if (pneData.id_contato) {
            try {
              const contatoRes = await api.get(`/clientes/${pneData.id_contato}`);
              pneData.cliente = contatoRes.data?.nome || 'Cliente não encontrado';
            } catch {
              pneData.cliente = 'Cliente não Localizado';
            }
          }
          setPneuInfo(pneData);
          setSearchSuccess(true);
          
          const apuntRes = await api.get(`/apontamentos/?id_pneu=${searchNum}`);
          setHistorico(apuntRes.data);
        } else {
          setSearchError('Pneu não encontrado no sistema');
          setSearchSuccess(false);
          setPneuInfo(null);
          setHistorico([]);
        }
      } catch (err: any) {
        console.error("Erro busca:", err);
        setSearchError(err.message || 'Erro ao buscar - ID não existe');
        setSearchSuccess(false);
        setPneuInfo(null);
        setHistorico([]);
      } finally {
        setSearchLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    setPneuInfo(null);
    setHistorico([]);
    setSearchError(undefined);
    setSearchSuccess(false);
  };

  const InfoField = ({ icon: Icon, label, value, className = "" }: { icon: any, label: string, value: any, className?: string }) => (
    <div className={`field-container ${className}`}>
      <div className="field-label">
        <Icon size={14} className="field-icon" />
        <span>{label}</span>
      </div>
      <div className="field-value-box">
        {value !== null && value !== undefined ? value : '---'}
      </div>
    </div>
  );

  return (
    <div className="localizacao-container fade-in">
      <header className="page-header">
        <div className="header-title-container">
          <div className="header-title">
            <MapPin size={32} className="text-primary" />
            <h1>Localização de Pneus</h1>
          </div>
          <p className="page-subtitle">Rastreabilidade completa e histórico de produção por item</p>
        </div>
      </header>

      {!searchSuccess && (
        <div className="search-section glass-panel p-6 mb-6">
          <div className="search-box">
            <Search size={22} className="search-icon" />
            <input
              type="text"
              placeholder="Digite o ID do Pneu para localizar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="large-search-input"
              autoFocus
            />
            {searchLoading && <Loader2 size={24} className="spinning search-loader" />}
          </div>
          {searchError && <p className="error-text mt-2 text-red-500 font-medium">⚠️ {searchError}</p>}
        </div>
      )}

      {pneuInfo && (
        <div className="pneu-result-card animate-slide-up">
          <div className="success-banner">
            <div className="success-dot"></div>
            PNEU IDENTIFICADO COM SUCESSO
          </div>

          <div className="info-main-grid glass-panel p-6">
            {/* Linha 1: ID, Cliente, OS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              <InfoField 
                icon={Hash} 
                label="# ID" 
                value={pneuInfo.id} 
                className="md:col-span-1"
              />
              <InfoField 
                icon={User} 
                label="Nome do Cliente" 
                value={pneuInfo.cliente} 
                className="md:col-span-8"
              />
              <InfoField 
                icon={FileText} 
                label="Nº Ordem de Serviço" 
                value={(!pneuInfo.numos || pneuInfo.numos === 'S/OS') ? 'NÃO VINCULADA' : pneuInfo.numos} 
                className="md:col-span-3"
              />
            </div>

            {/* Linha 2: Especificações e Identificação */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4">
              <InfoField icon={Ruler} label="Medida" value={pneuInfo.medida} />
              <InfoField icon={Package} label="Marca" value={pneuInfo.marca} />
              <InfoField icon={CheckCircle} label="Desenho" value={pneuInfo.desenho} />
              <InfoField icon={Layout} label="Tipo Recap." value={pneuInfo.tiporecap} />
              <InfoField icon={Clock} label="DOT" value={pneuInfo.dot} />
              <InfoField icon={Hash} label="Num. Série" value={pneuInfo.numserie} />
              <InfoField icon={Hash} label="Num. Fogo" value={pneuInfo.numfogo} />
            </div>

            {/* Linha 3: Financeiro e Status */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-2">
              <InfoField icon={Activity} label="Qte. Serviço" value={pneuInfo.qservico} />
              <InfoField 
                icon={DollarSign} 
                label="Vr. Serviço" 
                value={pneuInfo.vrservico ? pneuInfo.vrservico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'} 
                className="md:col-span-2"
              />
              <InfoField icon={RefreshCw} label="Status Prod." value={pneuInfo.statuspro} />
              <InfoField icon={FileCheck} label="Status Fat." value={pneuInfo.statusfat} />
              
              <div className="flex items-end justify-end">
                <button onClick={handleReset} className="btn-new-search h-12 w-full">
                  Nova Pesquisa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historico.length > 0 && (
        <div className="glass-panel table-container mt-6 animate-slide-up">
          <div className="table-header p-4 border-b border-slate-200/50 flex justify-between items-center">
            <h3 className="flex items-center text-slate-600 font-bold">
              <Clock size={18} className="mr-2 text-primary" />
              Histórico de Rastreabilidade (Apontamentos)
            </h3>
          </div>
          
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Setor</th>
                  <th>Operador</th>
                  <th style={{ width: '160px' }}>Início</th>
                  <th style={{ width: '160px' }}>Término</th>
                  <th style={{ width: '80px' }}>Tempo</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {historico.map(a => (
                  <tr key={a.id} className="history-row hover:bg-slate-50/50">
                    <td>
                      <div className="flex items-center">
                        <div className="setor-dot"></div>
                        <span className="font-medium">{a.desc_setor || `Setor ${a.id_setor}`}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center text-slate-600">
                        <User size={14} className="mr-1 opacity-50" />
                        {a.nome_operador || 'Sistema'}
                      </div>
                    </td>
                    <td className="text-slate-500 text-sm">
                      {a.inicio ? new Date(a.inicio).toLocaleString('pt-BR') : '---'}
                    </td>
                    <td className="text-slate-500 text-sm">
                      {a.termino ? new Date(a.termino).toLocaleString('pt-BR') : '---'}
                    </td>
                    <td className="font-mono text-xs">
                      {a.tempo ? `${Number(a.tempo).toFixed(1)} min` : '-'}
                    </td>
                    <td>
                      <span className={`status-badge-small ${
                        a.status === 'F' ? 'status-finalizado' : 
                        a.status === 'A' ? 'status-aberto' : 'status-pendente'
                      }`}>
                        {a.status === 'F' ? 'Finalizado' : a.status === 'A' ? 'Em Aberto' : (a.status || 'Pendente')}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400 italic">
                      {a.obs || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}