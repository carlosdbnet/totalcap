import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Search, 
  Calendar, 
  User, 
  Printer, 
  Loader2,
  Factory,
  AlertTriangle,
  FileText
} from 'lucide-react';
import api from '../../lib/api';
import './RelFalhas.css';
import LogoDbnet from '../../assets/images/LogoEmpresa.png';

interface FailureItem {
  id: number;
  data: string;
  setor_nome: string;
  operador_nome: string;
  falha_nome: string;
  numserie: string;
  obs: string;
}

export default function RelFalhas() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FailureItem[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [setores, setSetores] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [tiposFalha, setTiposFalha] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'falha' | 'setor'>('geral');

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [idSetor, setIdSetor] = useState<string>('');
  const [idOperador, setIdOperador] = useState<string>('');
  const [idFalha, setIdFalha] = useState<string>('');

  useEffect(() => {
    fetchLookups();
    handleSearch();
  }, []);

  const fetchLookups = async () => {
    try {
      const [sRes, oRes, fRes, eRes] = await Promise.all([
        api.get('/setores/'),
        api.get('/operadores/'),
        api.get('/falhas/tipofalhas/'),
        api.get('/empresas/')
      ]);
      setSetores(sRes.data);
      setOperadores(oRes.data);
      setTiposFalha(fRes.data);
      if (eRes.data && eRes.data.length > 0) {
        setEmpresa(eRes.data[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar filtros:", err);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (idSetor) params.append('id_setor', idSetor);
      if (idOperador) params.append('id_operador', idOperador);
      if (idFalha) params.append('id_falha', idFalha);

      const response = await api.get(`/falhas/registrofalha/?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      console.error("Erro ao buscar falhas:", err);
      alert("Erro ao buscar dados do relatório.");
    } finally {
      setLoading(false);
    }
  };

  // Grouping logic - Por Tipo de Falha
  const groupedByFalha = data.reduce((acc: any, curr) => {
    if (!acc[curr.falha_nome]) {
      acc[curr.falha_nome] = { qtd: 0 };
    }
    acc[curr.falha_nome].qtd += 1;
    return acc;
  }, {});

  // Grouping logic - Por Setor
  const groupedBySetor = data.reduce((acc: any, curr) => {
    if (!acc[curr.setor_nome]) {
      acc[curr.setor_nome] = { qtd: 0 };
    }
    acc[curr.setor_nome].qtd += 1;
    return acc;
  }, {});

  return (
    <div className="relatorio-container">
      {/* Cabeçalho de Impressão */}
      <div className="report-print-header only-print">
        <div className="print-header-top">
          <div className="print-logo">
            <img src={LogoDbnet} alt="Logo" />
          </div>
          <div className="print-main-row">
            <div className="print-company-name">{empresa?.razaosocial || 'NOME DA EMPRESA'}</div>
            <div className="print-date"><strong>Data Impressão:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
        <div className="print-header-bottom">
          <div className="print-report-title">RELATÓRIO DE FALHAS DE PRODUÇÃO</div>
          <div className="print-meta-info">
            <span><strong>Período:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} à {new Date(endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="relatorio-header no-print">
        <div className="relatorio-title">
          <AlertTriangle size={32} className="text-primary" style={{ color: '#ef4444' }} />
          <h1>Relatório de Falhas</h1>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Relatório
        </button>
      </div>

      <div className="relatorio-tabs no-print">
        <div 
          className={`tab-item ${activeTab === 'geral' ? 'active' : ''}`}
          onClick={() => setActiveTab('geral')}
        >
          <FileText size={18} /> Geral Detalhado
        </div>
        <div 
          className={`tab-item ${activeTab === 'falha' ? 'active' : ''}`}
          onClick={() => setActiveTab('falha')}
        >
          <AlertTriangle size={18} /> Resumo por Falha
        </div>
        <div 
          className={`tab-item ${activeTab === 'setor' ? 'active' : ''}`}
          onClick={() => setActiveTab('setor')}
        >
          <Factory size={18} /> Resumo por Setor
        </div>
      </div>

      <div className="filter-bar no-print">
        <div className="filter-row">
          <div className="input-group">
            <label><Calendar size={14} /> Início</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="input-group">
            <label><Calendar size={14} /> Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="input-group">
            <label><Factory size={14} /> Setor</label>
            <select value={idSetor} onChange={e => setIdSetor(e.target.value)}>
              <option value="">Todos os Setores</option>
              {setores.map(s => <option key={s.id} value={s.id}>{s.descricao}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label><User size={14} /> Operador</label>
            <select value={idOperador} onChange={e => setIdOperador(e.target.value)}>
              <option value="">Todos os Operadores</option>
              {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label><AlertTriangle size={14} /> Falha</label>
            <select value={idFalha} onChange={e => setIdFalha(e.target.value)}>
              <option value="">Todas as Falhas</option>
              {tiposFalha.map(f => <option key={f.id} value={f.id}>{f.descricao}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ height: '45px', marginTop: 'auto' }}>
            {loading ? <Loader2 className="spinning" /> : <Search size={20} />} Filtrar
          </button>
        </div>
      </div>

      <div className="results-section">
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'geral' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Setor</th>
                  <th>Operador</th>
                  <th>Falha</th>
                  <th>Pneu/OS</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhuma falha registrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.data).toLocaleString('pt-BR')}</td>
                      <td>{item.setor_nome}</td>
                      <td>{item.operador_nome}</td>
                      <td style={{ color: '#ef4444', fontWeight: 600 }}>{item.falha_nome}</td>
                      <td>{item.numserie}</td>
                      <td style={{ fontSize: '0.85rem' }}>{item.obs || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'falha' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Tipo de Falha</th>
                  <th style={{ textAlign: 'right' }}>Ocorrências</th>
                  <th style={{ textAlign: 'right' }}>% do Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByFalha).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedByFalha).map(f => (
                    <tr key={f}>
                      <td style={{ fontWeight: 600, color: '#ef4444' }}>{f}</td>
                      <td style={{ textAlign: 'right' }}>{groupedByFalha[f].qtd}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {((groupedByFalha[f].qtd / data.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'setor' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Setor</th>
                  <th style={{ textAlign: 'right' }}>Ocorrências</th>
                  <th style={{ textAlign: 'right' }}>% do Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedBySetor).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedBySetor).map(s => (
                    <tr key={s}>
                      <td style={{ fontWeight: 600 }}>{s}</td>
                      <td style={{ textAlign: 'right' }}>{groupedBySetor[s].qtd}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {((groupedBySetor[s].qtd / data.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {data.length > 0 && (
          <div className="relatorio-footer no-print">
            <div className="total-card">
              <span className="total-label">Total de Falhas</span>
              <span className="total-value" style={{ color: '#ef4444' }}>{data.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
