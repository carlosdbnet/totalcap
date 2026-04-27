import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  Printer, 
  Loader2,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import api from '../../lib/api';
import './RelOrdemServico.css';
import LogoDbnet from '../../assets/images/LogoEmpresa.png';

interface OSReportItem {
  id: number;
  numos: number;
  dataentrada: string;
  dataprevisao: string;
  status: string;
  vrtotal: number;
  cliente_nome: string;
}

export default function RelOrdemServico() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OSReportItem[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusOS, setStatusOS] = useState<string>('');
  const [idContato, setIdContato] = useState<string>('');

  useEffect(() => {
    fetchLookups();
    handleSearch();
  }, []);

  const fetchLookups = async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        api.get('/empresas/'),
        api.get('/clientes/')
      ]);
      
      if (eRes.data && eRes.data.length > 0) {
        setEmpresa(eRes.data[0]);
      }
      setClientes(cRes.data);
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
      if (statusOS) params.append('status_os', statusOS);
      if (idContato) params.append('id_contato', idContato);

      const response = await api.get(`/ordens-servico/relatorio?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      console.error("Erro ao buscar ordens de serviço:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

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
          <div className="print-report-title">RELATÓRIO DE ORDENS DE SERVIÇO</div>
          <div className="print-meta-info">
            <span><strong>Período:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} à {new Date(endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="relatorio-header no-print">
        <div className="relatorio-title">
          <FileText size={32} className="text-primary" style={{ color: '#3b82f6' }} />
          <h1>Relatório de Ordens de Serviço</h1>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Relatório
        </button>
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
          <div className="input-group" style={{ flex: 2 }}>
            <label><User size={14} /> Cliente</label>
            <select value={idContato} onChange={e => setIdContato(e.target.value)}>
              <option value="">Todos os Clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label><Clock size={14} /> Status</label>
            <select value={statusOS} onChange={e => setStatusOS(e.target.value)}>
              <option value="">Todos</option>
              <option value="ABERTA">Aberta</option>
              <option value="PRODUCAO">Em Produção</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
          <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ height: '45px', marginTop: 'auto', background: '#3b82f6' }}>
            {loading ? <Loader2 className="spinning" /> : <Search size={20} />} Filtrar
          </button>
        </div>
      </div>

      <div className="results-section">
        <div style={{ overflowX: 'auto' }}>
          <table className="relatorio-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Número OS</th>
                <th>Cliente</th>
                <th>Previsão</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhuma ordem de serviço encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id}>
                    <td>{item.dataentrada ? new Date(item.dataentrada).toLocaleDateString('pt-BR') : '-'}</td>
                    <td><span className="os-number">#{item.numos}</span></td>
                    <td>{item.cliente_nome || 'N/A'}</td>
                    <td>{item.dataprevisao ? new Date(item.dataprevisao).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                      <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(item.vrtotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="relatorio-footer no-print">
            <div className="total-card">
              <span className="total-label">Total de Ordens</span>
              <span className="total-value">{data.length}</span>
            </div>
            <div className="total-card">
              <span className="total-label">Valor Total</span>
              <span className="total-value" style={{ color: '#3b82f6' }}>
                {formatCurrency(data.reduce((acc, curr) => acc + curr.vrtotal, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
