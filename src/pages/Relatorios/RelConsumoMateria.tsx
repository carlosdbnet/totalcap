import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Search, 
  Calendar, 
  Printer, 
  Loader2,
  Layers,
  Package,
  TrendingDown
} from 'lucide-react';
import api from '../../lib/api';
import './RelConsumoMateria.css';
import LogoDbnet from '../../assets/images/LogoEmpresa.png';

interface ConsumoItem {
  id: number;
  data: string;
  produto_nome: string;
  unidade: string;
  quant: number;
  setor_nome: string;
  operador_nome: string;
  obs: string;
}

export default function RelConsumoMateria() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConsumoItem[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'produto'>('geral');

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [idProduto, setIdProduto] = useState<string>('');

  useEffect(() => {
    fetchLookups();
    handleSearch();
  }, []);

  const fetchLookups = async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        api.get('/produtos/'),
        api.get('/empresas/')
      ]);
      setProdutos(pRes.data);
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
      if (idProduto) params.append('id_produto', idProduto);

      const response = await api.get(`/consumo-materia/relatorio?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      console.error("Erro ao buscar consumo:", err);
      alert("Erro ao buscar dados do relatório.");
    } finally {
      setLoading(false);
    }
  };

  // Grouping logic - Por Insumo/Produto
  const groupedByProduto = data.reduce((acc: any, curr) => {
    if (!acc[curr.produto_nome]) {
      acc[curr.produto_nome] = { nome: curr.produto_nome, unidade: curr.unidade, total: 0, qtd: 0 };
    }
    acc[curr.produto_nome].total += curr.quant;
    acc[curr.produto_nome].qtd += 1;
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
          <div className="print-report-title">RELATÓRIO DE CONSUMO DE MATÉRIA-PRIMA</div>
          <div className="print-meta-info">
            <span><strong>Período:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} à {new Date(endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="relatorio-header no-print">
        <div className="relatorio-title">
          <TrendingDown size={32} className="text-primary" style={{ color: '#f59e0b' }} />
          <h1>Relatório de Consumo</h1>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Consumo
        </button>
      </div>

      <div className="relatorio-tabs no-print">
        <div 
          className={`tab-item ${activeTab === 'geral' ? 'active' : ''}`}
          onClick={() => setActiveTab('geral')}
        >
          <Layers size={18} /> Lançamentos Detalhados
        </div>
        <div 
          className={`tab-item ${activeTab === 'produto' ? 'active' : ''}`}
          onClick={() => setActiveTab('produto')}
        >
          <Package size={18} /> Resumo por Insumo
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
            <label><Package size={14} /> Produto/Insumo</label>
            <select value={idProduto} onChange={e => setIdProduto(e.target.value)}>
              <option value="">Todos os Insumos</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.descricao}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ height: '45px', marginTop: 'auto', background: '#f59e0b' }}>
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
                  <th>Produto/Insumo</th>
                  <th style={{ textAlign: 'right' }}>Quantidade</th>
                  <th>Unidade</th>
                  <th>Setor</th>
                  <th>Operador</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum consumo registrado no período.
                    </td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.data).toLocaleString('pt-BR')}</td>
                      <td style={{ fontWeight: 600 }}>{item.produto_nome}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.quant.toFixed(3)}</td>
                      <td>{item.unidade}</td>
                      <td>{item.setor_nome}</td>
                      <td>{item.operador_nome}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'produto' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Insumo/Matéria-Prima</th>
                  <th style={{ textAlign: 'right' }}>Qtd. Lançamentos</th>
                  <th style={{ textAlign: 'right' }}>Consumo Total</th>
                  <th>Unidade</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByProduto).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedByProduto).map(p => (
                    <tr key={p}>
                      <td style={{ fontWeight: 600 }}>{p}</td>
                      <td style={{ textAlign: 'right' }}>{groupedByProduto[p].qtd}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f59e0b', fontSize: '1.1rem' }}>
                        {groupedByProduto[p].total.toFixed(3)}
                      </td>
                      <td>{groupedByProduto[p].unidade}</td>
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
              <span className="total-label">Total de Registros de Consumo</span>
              <span className="total-value">{data.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
