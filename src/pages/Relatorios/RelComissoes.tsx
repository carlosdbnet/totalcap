import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  Calendar, 
  User, 
  Printer, 
  Loader2,
  DollarSign
} from 'lucide-react';
import api from '../../lib/api';
import './RelComissoes.css';

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
  const [vendedores, setVendedores] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [idVendedor, setIdVendedor] = useState<string>('');

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const vRes = await api.get('/vendedores/');
      setVendedores(vRes.data);
    } catch (err) {
      console.error("Erro ao carregar vendedores:", err);
    }
  };

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

  // Grouping logic for subtotals
  const groupedData = data.reduce((acc: any, curr) => {
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

  const totalGeralComissao = data.reduce((acc, curr) => acc + curr.vrcomissao, 0);

  return (
    <div className="comissoes-container">
      <div className="comissoes-header">
        <div className="comissoes-title">
          <BarChart3 size={32} className="text-primary" />
          <h1>Relatório de Comissões</h1>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Comissões (PDF)
        </button>
      </div>

      <div className="filter-card">
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
        <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ height: '45px' }}>
          {loading ? <Loader2 className="spinning" /> : <Search size={20} />} Filtrar Comissões
        </button>
      </div>

      <div className="results-card">
        <div style={{ overflowX: 'auto' }}>
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
              {Object.keys(groupedData).length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum lançamento de comissão encontrado.
                  </td>
                </tr>
              ) : (
                Object.keys(groupedData).map(vendedor => (
                  <>
                    <tr key={vendedor} className="vendedor-row">
                      <td colSpan={7}>
                        {vendedor} - Subtotal: R$ {groupedData[vendedor].totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {groupedData[vendedor].items.map((item: any) => (
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
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="summary-footer">
            <div className="total-card">
              <span className="total-label">Total Commissions (Period)</span>
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
