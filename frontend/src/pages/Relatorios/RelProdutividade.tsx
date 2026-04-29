import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Search, 
  Calendar, 
  User, 
  Printer, 
  Loader2,
  Factory,
  Clock,
  Layers
} from 'lucide-react';
import api from '../../lib/api';
import './RelProdutividade.css';
import LogoDbnet from '../../assets/images/LogoEmpresa.png';

interface ProductivityItem {
  id: number;
  inicio: string;
  termino: string;
  tempo: number;
  setor_nome: string;
  operador_nome: string;
  numserie: string;
  numfogo: string;
  numos: number;
}

export default function RelProdutividade() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductivityItem[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [setores, setSetores] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'operador' | 'setor'>('geral');

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [idSetor, setIdSetor] = useState<string>('');
  const [idOperador, setIdOperador] = useState<string>('');

  useEffect(() => {
    fetchLookups();
    handleSearch();
  }, []);

  const fetchLookups = async () => {
    try {
      const [sRes, oRes, eRes] = await Promise.all([
        api.get('/setores/'),
        api.get('/operadores/'),
        api.get('/empresas/')
      ]);
      setSetores(sRes.data);
      setOperadores(oRes.data);
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

      const response = await api.get(`/apontamentos/relatorio?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      console.error("Erro ao buscar produtividade:", err);
      alert("Erro ao buscar dados do relatório.");
    } finally {
      setLoading(false);
    }
  };

  // Grouping logic - Por Operador
  const groupedByOperador = data.reduce((acc: any, curr) => {
    if (!acc[curr.operador_nome]) {
      acc[curr.operador_nome] = { items: [], totalTempo: 0, qtd: 0 };
    }
    acc[curr.operador_nome].items.push(curr);
    acc[curr.operador_nome].totalTempo += curr.tempo;
    acc[curr.operador_nome].qtd += 1;
    return acc;
  }, {});

  // Grouping logic - Por Setor
  const groupedBySetor = data.reduce((acc: any, curr) => {
    if (!acc[curr.setor_nome]) {
      acc[curr.setor_nome] = { items: [], totalTempo: 0, qtd: 0 };
    }
    acc[curr.setor_nome].items.push(curr);
    acc[curr.setor_nome].totalTempo += curr.tempo;
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
          <div className="print-report-title">RELATÓRIO DE PRODUTIVIDADE</div>
          <div className="print-meta-info">
            <span><strong>Período:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} à {new Date(endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="relatorio-header no-print">
        <div className="relatorio-title">
          <BarChart2 size={32} className="text-primary" />
          <h1>Relatório de Produtividade</h1>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Produtividade
        </button>
      </div>

      <div className="relatorio-tabs no-print">
        <div 
          className={`tab-item ${activeTab === 'geral' ? 'active' : ''}`}
          onClick={() => setActiveTab('geral')}
        >
          <Layers size={18} /> Geral Detalhado
        </div>
        <div 
          className={`tab-item ${activeTab === 'operador' ? 'active' : ''}`}
          onClick={() => setActiveTab('operador')}
        >
          <User size={18} /> Resumo por Operador
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
                  <th>OS/Pneu</th>
                  <th>Setor</th>
                  <th>Operador</th>
                  <th>Início</th>
                  <th>Término</th>
                  <th style={{ textAlign: 'right' }}>Tempo (min)</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum apontamento encontrado.
                    </td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>OS #{item.numos} - {item.numserie}</td>
                      <td>{item.setor_nome}</td>
                      <td>{item.operador_nome}</td>
                      <td>{item.inicio ? new Date(item.inicio).toLocaleString('pt-BR') : '-'}</td>
                      <td>{item.termino ? new Date(item.termino).toLocaleString('pt-BR') : '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.tempo.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'operador' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Operador</th>
                  <th style={{ textAlign: 'right' }}>Qtd. Apontamentos</th>
                  <th style={{ textAlign: 'right' }}>Tempo Total (min)</th>
                  <th style={{ textAlign: 'right' }}>Média/Serviço</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByOperador).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedByOperador).map(op => (
                    <tr key={op}>
                      <td style={{ fontWeight: 600 }}>{op}</td>
                      <td style={{ textAlign: 'right' }}>{groupedByOperador[op].qtd}</td>
                      <td style={{ textAlign: 'right' }}>{groupedByOperador[op].totalTempo.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {(groupedByOperador[op].totalTempo / groupedByOperador[op].qtd).toFixed(2)} min
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
                  <th style={{ textAlign: 'right' }}>Qtd. Apontamentos</th>
                  <th style={{ textAlign: 'right' }}>Tempo Total (min)</th>
                  <th style={{ textAlign: 'right' }}>Média/Serviço</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedBySetor).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedBySetor).map(setor => (
                    <tr key={setor}>
                      <td style={{ fontWeight: 600 }}>{setor}</td>
                      <td style={{ textAlign: 'right' }}>{groupedBySetor[setor].qtd}</td>
                      <td style={{ textAlign: 'right' }}>{groupedBySetor[setor].totalTempo.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                        {(groupedBySetor[setor].totalTempo / groupedBySetor[setor].qtd).toFixed(2)} min
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
              <span className="total-label">Total de Peças/Apontamentos</span>
              <span className="total-value">{data.length}</span>
            </div>
            <div className="total-card">
              <span className="total-label">Tempo Total Produzido</span>
              <span className="total-value" style={{ color: '#10b981' }}>
                {data.reduce((acc, curr) => acc + curr.tempo, 0).toFixed(2)} min
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
