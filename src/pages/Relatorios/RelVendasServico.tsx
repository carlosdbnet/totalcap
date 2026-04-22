import { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Search, 
  Calendar, 
  User, 
  Users, 
  Printer, 
  Download,
  Loader2,
  Filter
} from 'lucide-react';
import api from '../../lib/api';
import './RelVendasServico.css';

interface ReportItem {
  id: number;
  fatura_id: number;
  datafat: string;
  cliente_nome: string;
  vendedor_nome: string;
  numserie: string;
  numfogo: string;
  servico_nome: string;
  quant: number;
  valor: number;
  vrtotal: number;
  pcomissao: number;
}

export default function RelVendasServico() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportItem[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [contatos, setContatos] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [idContato, setIdContato] = useState<string>('');
  const [idVendedor, setIdVendedor] = useState<string>('');

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        api.get('/vendedores/'),
        api.get('/clientes/')
      ]);
      setVendedores(vRes.data);
      setContatos(cRes.data);
    } catch (err) {
      console.error("Erro ao carregar filtros:", err);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (idContato) params.append('id_contato', idContato);
      if (idVendedor) params.append('id_vendedor', idVendedor);

      const response = await api.get(`/faturas/relatorio/vendas-servico?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      console.error("Erro ao buscar relatório:", err);
      alert("Erro ao buscar dados do relatório.");
    } finally {
      setLoading(false);
    }
  };

  const totalVendas = data.reduce((acc, curr) => acc + curr.vrtotal, 0);
  const totalItems = data.length;

  return (
    <div className="relatorio-container">
      <div className="relatorio-header">
        <div className="relatorio-title">
          <BarChart2 size={32} className="text-primary" />
          <h1>Relatório de Vendas por Serviço</h1>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Relatório (PDF)
        </button>
      </div>

      <div className="filter-bar">
        <div className="input-group">
          <label><Calendar size={14} /> Período Início</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="input-group">
          <label><Calendar size={14} /> Período Fim</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="input-group">
          <label><Users size={14} /> Cliente</label>
          <select value={idContato} onChange={e => setIdContato(e.target.value)}>
            <option value="">Todos os Clientes</option>
            {contatos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label><User size={14} /> Vendedor</label>
          <select value={idVendedor} onChange={e => setIdVendedor(e.target.value)}>
            <option value="">Todos os Vendedores</option>
            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ height: '45px' }}>
          {loading ? <Loader2 className="spinning" /> : <Search size={20} />} Gerar Relatório
        </button>
      </div>

      <div className="results-section">
        <div style={{ overflowX: 'auto' }}>
          <table className="relatorio-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Pneu (Série/Fogo)</th>
                <th>Serviço</th>
                <th style={{ textAlign: 'right' }}>Qtd</th>
                <th style={{ textAlign: 'right' }}>Vl. Unit</th>
                <th style={{ textAlign: 'right' }}>Vl. Total</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum dado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.datafat).toLocaleDateString('pt-BR')}</td>
                    <td>{item.cliente_nome}</td>
                    <td>{item.vendedor_nome}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {item.numserie || '-'} / {item.numfogo || '-'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.servico_nome}</td>
                    <td style={{ textAlign: 'right' }}>{item.quant}</td>
                    <td style={{ textAlign: 'right' }}>
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                      R$ {item.vrtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="relatorio-footer">
             <div className="total-card">
              <span className="total-label">Total de Itens</span>
              <span className="total-value">{totalItems}</span>
            </div>
            <div className="total-card">
              <span className="total-label">Valor Total Geral</span>
              <span className="total-value">
                R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
