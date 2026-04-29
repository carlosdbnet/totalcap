import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Search, 
  Calendar, 
  User, 
  Printer, 
  Loader2,
  DollarSign
} from 'lucide-react';
import api from '../../lib/api';
import './RelComissoes.css';
import LogoDbnet from '../../assets/images/LogoEmpresa.png';

interface CommissionItem {
  id: number;
  fatura_id: number;
  datafat: string;
  cliente_nome: string;
  vendedor_nome: string;
  servico_nome: string;
  vrtotal: number;
  pcomissao: number;
  vrcomissao: number;
}

export default function RelComissoes() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CommissionItem[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'vendedor' | 'data' | 'servico'>('vendedor');

  // Filters - Default to start of current month
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [idVendedor, setIdVendedor] = useState<string>('');

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const [vRes, eRes] = await Promise.all([
        api.get('/vendedores/'),
        api.get('/empresas/')
      ]);
      setVendedores(vRes.data);
      if (eRes.data && eRes.data.length > 0) {
        setEmpresa(eRes.data[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar lookups:", err);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [vendedores]); // Trigger search once vendedores are loaded to ensure names map correctly if needed, but primarily for auto-load

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (idVendedor) params.append('id_vendedor', idVendedor);

      const response = await api.get(`/faturas/relatorio/comissoes?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      console.error("Erro ao buscar comissões:", err);
      alert("Erro ao buscar dados de comissões.");
    } finally {
      setLoading(false);
    }
  };

  // Grouping logic for subtotals - Por Vendedor
  const groupedByVendedor = data.reduce((acc: any, curr) => {
    if (!acc[curr.vendedor_nome]) {
      acc[curr.vendedor_nome] = {
        items: [],
        totalVendas: 0,
        totalComissao: 0
      };
    }
    acc[curr.vendedor_nome].items.push(curr);
    acc[curr.vendedor_nome].totalVendas += curr.vrtotal;
    acc[curr.vendedor_nome].totalComissao += curr.vrcomissao;
    return acc;
  }, {});

  // Grouping logic - Por Serviço
  const groupedByServico = data.reduce((acc: any, curr) => {
    if (!acc[curr.servico_nome]) {
      acc[curr.servico_nome] = {
        items: [],
        totalVendas: 0,
        totalComissao: 0,
        quantidade: 0
      };
    }
    acc[curr.servico_nome].items.push(curr);
    acc[curr.servico_nome].totalVendas += curr.vrtotal;
    acc[curr.servico_nome].totalComissao += curr.vrcomissao;
    acc[curr.servico_nome].quantidade += 1; // Assuming each item is one service instance
    return acc;
  }, {});

  // Sort by Data
  const sortedByData = [...data].sort((a, b) => new Date(a.datafat).getTime() - new Date(b.datafat).getTime());

  const totalGeralComissao = data.reduce((acc, curr) => acc + curr.vrcomissao, 0);
  const totalGeralVendas = data.reduce((acc, curr) => acc + curr.vrtotal, 0);

  return (
    <div className="relatorio-container">
      {/* Cabeçalho de Impressão (Modelo solicitado) */}
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
          <div className="print-report-title">RELATÓRIO DE COMISSÕES</div>
          <div className="print-meta-info">
            <span><strong>Período:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} à {new Date(endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="relatorio-header no-print">
        <div className="relatorio-title">
          <BarChart2 size={32} className="text-primary" />
          <h1>Relatório de Comissões</h1>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Comissões (PDF)
        </button>
      </div>

      <div className="relatorio-tabs no-print">
        <div 
          className={`tab-item ${activeTab === 'vendedor' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendedor')}
        >
          <User size={18} /> Vendedor/Fatura
        </div>
        <div 
          className={`tab-item ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <Calendar size={18} /> Vendedor/Resumo
        </div>
        <div 
          className={`tab-item ${activeTab === 'servico' ? 'active' : ''}`}
          onClick={() => setActiveTab('servico')}
        >
          <DollarSign size={18} /> Por Serviço
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
            <label><User size={14} /> Vendedor</label>
            <select value={idVendedor} onChange={e => setIdVendedor(e.target.value)}>
              <option value="">Todos os Vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ height: '45px', marginTop: 'auto' }}>
            {loading ? <Loader2 className="spinning" /> : <Search size={20} />} Filtrar Comissões
          </button>
        </div>
      </div>

      <div className="results-section">
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'vendedor' && (
            <table className="comissoes-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Fatura</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th style={{ textAlign: 'right' }}>Vl. Venda</th>
                  <th style={{ textAlign: 'right' }}>% Comis.</th>
                  <th style={{ textAlign: 'right' }}>Vl. Comissão</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByVendedor).length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedByVendedor).map(vendedor => (
                    <React.Fragment key={vendedor}>
                      <tr className="vendedor-row">
                        <td colSpan={7}>
                          {vendedor} - Subtotal: R$ {groupedByVendedor[vendedor].totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {groupedByVendedor[vendedor].items.map((item: any) => (
                        <tr key={item.id}>
                          <td>{new Date(item.datafat).toLocaleDateString('pt-BR')}</td>
                          <td>#{item.fatura_id}</td>
                          <td>{item.cliente_nome}</td>
                          <td style={{ fontSize: '0.9rem' }}>{item.servico_nome}</td>
                          <td style={{ textAlign: 'right' }}>
                            R$ {item.vrtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="commission-badge">{item.pcomissao}%</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            R$ {item.vrcomissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'data' && (
            <table className="comissoes-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th style={{ textAlign: 'right' }}>Qtd. Serviços</th>
                  <th style={{ textAlign: 'right' }}>Total Vendas</th>
                  <th style={{ textAlign: 'right' }}>Total Comissões</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByVendedor).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedByVendedor).map((vendedor) => (
                    <tr key={vendedor}>
                      <td style={{ fontWeight: 600 }}>{vendedor}</td>
                      <td style={{ textAlign: 'right' }}>{groupedByVendedor[vendedor].items.length}</td>
                      <td style={{ textAlign: 'right' }}>
                        R$ {groupedByVendedor[vendedor].totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                        R$ {groupedByVendedor[vendedor].totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'servico' && (
            <table className="comissoes-table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th style={{ textAlign: 'right' }}>Qtd</th>
                  <th style={{ textAlign: 'right' }}>Vl. Venda Total</th>
                  <th style={{ textAlign: 'right' }}>Vl. Comissão Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByServico).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedByServico).map(servico => (
                    <tr key={servico}>
                      <td style={{ fontWeight: 600 }}>{servico}</td>
                      <td style={{ textAlign: 'right' }}>{groupedByServico[servico].quantidade}</td>
                      <td style={{ textAlign: 'right' }}>
                        R$ {groupedByServico[servico].totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                        R$ {groupedByServico[servico].totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {data.length > 0 && (
          <div className="summary-footer no-print">
            <div className="total-card">
              <span className="total-label">Total Vendas (Período)</span>
              <span className="total-value">
                R$ {totalGeralVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="total-card">
              <span className="total-label">Total Comissões (Período)</span>
              <span className="total-value" style={{ color: '#10b981' }}>
                R$ {totalGeralComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
