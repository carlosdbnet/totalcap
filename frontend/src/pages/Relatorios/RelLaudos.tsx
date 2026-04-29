import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  Printer, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  User
} from 'lucide-react';
import api from '../../lib/api';
import './RelLaudos.css';
import LogoDbnet from '../../assets/images/LogoEmpresa.png';

interface LaudoReportItem {
  id: number;
  data: string;
  numlaudo: number;
  numserie: string;
  resultado: string;
  vrcredito: number;
  vrpago: number;
  vrsaldo: number;
  cliente_nome: string;
}

export default function RelLaudos() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LaudoReportItem[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [resultado, setResultado] = useState<string>('');
  const [idContato, setIdContato] = useState<string>('');
  const [filterSaldo, setFilterSaldo] = useState<string>(''); // '', 'sim', 'nao'

  useEffect(() => {
    fetchLookups();
    handleSearch();
  }, []);

  const fetchLookups = async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        api.get('/empresas/'),
        api.get('/contatos/')
      ]);
      
      if (eRes.data && eRes.data.length > 0) {
        setEmpresa(eRes.data[0]);
      }
      setClientes(cRes.data.filter((c: any) => c.flagcliente || c.razaosocial));
    } catch (err) {
      console.error("Erro ao carregar filtros:", err);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    console.log("Filtrando laudos com:", { startDate, endDate, resultado });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (resultado) params.append('resultado', resultado);
      if (idContato) params.append('id_contato', idContato);
      
      if (filterSaldo === 'sim') params.append('com_saldo', 'true');
      if (filterSaldo === 'nao') params.append('com_saldo', 'false');

      const response = await api.get(`/laudos/relatorio?${params.toString()}`);
      console.log("Resposta da API:", response.data);
      setData(response.data);
    } catch (err) {
      console.error("Erro ao buscar laudos:", err);
      alert("Erro ao buscar dados do relatório.");
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
          <div className="print-report-title">RELATÓRIO DE LAUDOS TÉCNICOS</div>
          <div className="print-meta-info">
            <span><strong>Período:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} à {new Date(endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="relatorio-header no-print">
        <div className="relatorio-title">
          <FileText size={32} className="text-primary" style={{ color: '#3b82f6' }} />
          <h1>Relatório de Laudos</h1>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Laudos
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
                <option key={c.id} value={c.id}>{c.razaosocial || c.nome}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label><CheckCircle size={14} /> Resultado</label>
            <select value={resultado} onChange={e => setResultado(e.target.value)}>
              <option value="">Todos os Resultados</option>
              <option value="A">Aprovado</option>
              <option value="R">Recusado</option>
              <option value="O">Outros</option>
            </select>
          </div>
          <div className="input-group">
            <label><DollarSign size={14} /> Saldo</label>
            <select value={filterSaldo} onChange={e => setFilterSaldo(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Com Saldo</option>
              <option value="nao">Sem Saldo</option>
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
                <th>Laudo</th>
                <th>Cliente</th>
                <th>Resultado</th>
                <th style={{ textAlign: 'right' }}>Vr. Crédito</th>
                <th style={{ textAlign: 'right' }}>Vr. Pago</th>
                <th style={{ textAlign: 'right' }}>Vr. Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum laudo encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id}>
                    <td>{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                    <td><span className="os-number">#{item.numlaudo}</span></td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.cliente_nome || 'N/A'}
                    </td>
                    <td>
                      <span className={`result-badge res-${item.resultado?.toLowerCase()}`}>
                        {item.resultado === 'A' ? 'Aprovado' : item.resultado === 'R' ? 'Recusado' : 'Outros'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.vrcredito)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.vrpago)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: item.vrsaldo > 0 ? '#10b981' : 'var(--text-main)' }}>
                      {formatCurrency(item.vrsaldo)}
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
              <span className="total-label">Total de Laudos</span>
              <span className="total-value">{data.length}</span>
            </div>
            <div className="total-card">
              <span className="total-label">Total Crédito</span>
              <span className="total-value" style={{ color: '#3b82f6' }}>
                {formatCurrency(data.reduce((acc, curr) => acc + curr.vrcredito, 0))}
              </span>
            </div>
            <div className="total-card">
              <span className="total-label">Saldo Pendente</span>
              <span className="total-value" style={{ color: '#10b981' }}>
                {formatCurrency(data.reduce((acc, curr) => acc + curr.vrsaldo, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
