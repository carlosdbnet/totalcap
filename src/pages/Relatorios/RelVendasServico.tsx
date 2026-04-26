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
  Filter,
  MapPin,
  Map,
  Layers,
  Ruler,
  PenTool,
  DollarSign
} from 'lucide-react';
import api from '../../lib/api';
import './RelVendasServico.css';
import LogoDbnet from '../../assets/images/LogoEmpresa.png';

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
  tiporecap_nome: string;
  medida_nome: string;
  desenho_nome: string;
}

export default function RelVendasServico() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'servico' | 'cliente' | 'data' | 'preco_medio'>('data');
  const [data, setData] = useState<ReportItem[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [contatos, setContatos] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [regioes, setRegioes] = useState<any[]>([]);
  const [tiposRecap, setTiposRecap] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);
  const [desenhos, setDesenhos] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [idContato, setIdContato] = useState<string>('');
  const [idVendedor, setIdVendedor] = useState<string>('');
  const [idArea, setIdArea] = useState<string>('');
  const [idRegiao, setIdRegiao] = useState<string>('');
  const [idTipoRecap, setIdTipoRecap] = useState<string>('');
  const [idMedida, setIdMedida] = useState<string>('');
  const [idDesenho, setIdDesenho] = useState<string>('');

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const [vRes, cRes, aRes, rRes, trRes, mRes, dRes, eRes] = await Promise.all([
        api.get('/vendedores/'),
        api.get('/clientes/'),
        api.get('/areas/'),
        api.get('/regioes/'),
        api.get('/tipo-recapagem/'),
        api.get('/medidas/'),
        api.get('/desenhos/'),
        api.get('/empresas/')
      ]);
      setVendedores(vRes.data);
      setContatos(cRes.data);
      setAreas(aRes.data);
      setRegioes(rRes.data);
      setTiposRecap(trRes.data);
      setMedidas(mRes.data);
      setDesenhos(dRes.data);
      if (eRes.data && eRes.data.length > 0) {
        setEmpresa(eRes.data[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar filtros:", err);
    }
  };

  const getActiveFiltersSummary = () => {
    const filters = [];
    if (idContato) {
      const c = contatos.find(item => item.id === parseInt(idContato));
      if (c) filters.push(`Cliente: ${c.nome}`);
    }
    if (idVendedor) {
      const v = vendedores.find(item => item.id === parseInt(idVendedor));
      if (v) filters.push(`Vendedor: ${v.nome}`);
    }
    if (idArea) {
      const a = areas.find(item => item.id === parseInt(idArea));
      if (a) filters.push(`Área: ${a.descricao}`);
    }
    if (idRegiao) {
      const r = regioes.find(item => item.id === parseInt(idRegiao));
      if (r) filters.push(`Região: ${r.descricao}`);
    }
    if (idTipoRecap) {
      const tr = tiposRecap.find(item => item.id === parseInt(idTipoRecap));
      if (tr) filters.push(`Recap: ${tr.descricao}`);
    }
    if (idMedida) {
      const m = medidas.find(item => item.id === parseInt(idMedida));
      if (m) filters.push(`Medida: ${m.medida}`);
    }
    if (idDesenho) {
      const d = desenhos.find(item => item.id === parseInt(idDesenho));
      if (d) filters.push(`Desenho: ${d.descricao}`);
    }
    return filters.length > 0 ? filters.join(' | ') : 'Todos';
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (idContato) params.append('id_contato', idContato);
      if (idVendedor) params.append('id_vendedor', idVendedor);
      if (idArea) params.append('id_area', idArea);
      if (idRegiao) params.append('id_regiao', idRegiao);
      if (idTipoRecap) params.append('id_tiporecap', idTipoRecap);
      if (idMedida) params.append('id_medida', idMedida);
      if (idDesenho) params.append('id_desenho', idDesenho);

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

  // Grouping logic
  const groupedByService = data.reduce((acc: any, curr) => {
    if (!acc[curr.servico_nome]) {
      acc[curr.servico_nome] = { nome: curr.servico_nome, qtd: 0, total: 0 };
    }
    acc[curr.servico_nome].qtd += curr.quant;
    acc[curr.servico_nome].total += curr.vrtotal;
    return acc;
  }, {});

  const groupedByClient = data.reduce((acc: any, curr) => {
    if (!acc[curr.cliente_nome]) {
      acc[curr.cliente_nome] = { nome: curr.cliente_nome, qtd: 0, total: 0 };
    }
    acc[curr.cliente_nome].qtd += curr.quant;
    acc[curr.cliente_nome].total += curr.vrtotal;
    return acc;
  }, {});

  // Grouping logic for Preço Médio (Tipo Recap + Medida + Desenho + Produto)
  const groupedByPrecoMedio = data.reduce((acc: any, curr) => {
    const key = `${curr.tiporecap_nome}|${curr.medida_nome}|${curr.desenho_nome}|${curr.servico_nome}`;
    if (!acc[key]) {
      acc[key] = {
        tipo: curr.tiporecap_nome,
        medida: curr.medida_nome,
        desenho: curr.desenho_nome,
        produto: curr.servico_nome,
        quantidade: 0,
        valorTotal: 0
      };
    }
    acc[key].quantidade += curr.quant;
    acc[key].valorTotal += curr.vrtotal;
    return acc;
  }, {});

  const handlePrint = () => {
    document.body.classList.add('printing-report-active');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report-active');
    }, 500);
  };

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
          <div className="print-report-title">RELATÓRIO DE VENDAS</div>
          <div className="print-meta-info">
            <span><strong>Período:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} à {new Date(endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="relatorio-header no-print">
        <div className="relatorio-title">
          <BarChart2 size={32} className="text-primary" />
          <h1>Relatório de Vendas</h1>
        </div>
        <button className="btn-primary" onClick={handlePrint} style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={20} /> Imprimir Relatório (PDF)
        </button>
      </div>

      <div className="relatorio-tabs no-print">
        <div 
          className={`tab-item ${activeTab === 'servico' ? 'active' : ''}`} 
          onClick={() => setActiveTab('servico')}
        >
          <Filter size={18} /> Por Serviço
        </div>
        <div 
          className={`tab-item ${activeTab === 'cliente' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cliente')}
        >
          <User size={18} /> Por Cliente
        </div>
        <div 
          className={`tab-item ${activeTab === 'data' ? 'active' : ''}`} 
          onClick={() => setActiveTab('data')}
        >
          <Calendar size={18} /> Por Data
        </div>
        <div 
          className={`tab-item ${activeTab === 'preco_medio' ? 'active' : ''}`} 
          onClick={() => setActiveTab('preco_medio')}
        >
          <DollarSign size={18} /> Preço Médio
        </div>
      </div>

      <div className="filter-bar no-print">
        <div className="filter-row">
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
        </div>

        <div className="filter-row">
          <div className="input-group">
            <label><MapPin size={14} /> Área</label>
            <select value={idArea} onChange={e => setIdArea(e.target.value)}>
              <option value="">Todas as Áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.descricao}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label><Map size={14} /> Região</label>
            <select value={idRegiao} onChange={e => setIdRegiao(e.target.value)}>
              <option value="">Todas as Regiões</option>
              {regioes.map(r => <option key={r.id} value={r.id}>{r.descricao}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label><Layers size={14} /> Tipo Recapagem</label>
            <select value={idTipoRecap} onChange={e => setIdTipoRecap(e.target.value)}>
              <option value="">Todos os Tipos</option>
              {tiposRecap.map(t => <option key={t.id} value={t.id}>{t.descricao}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label><Ruler size={14} /> Medida</label>
            <select value={idMedida} onChange={e => setIdMedida(e.target.value)}>
              <option value="">Todas as Medidas</option>
              {medidas.map(m => <option key={m.id} value={m.id}>{m.medida}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label><PenTool size={14} /> Desenho</label>
            <select value={idDesenho} onChange={e => setIdDesenho(e.target.value)}>
              <option value="">Todos os Desenhos</option>
              {desenhos.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
            </select>
          </div>
          
          <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ height: '45px', marginTop: 'auto' }}>
            {loading ? <Loader2 className="spinning" /> : <Search size={20} />} Gerar Relatório
          </button>
        </div>
      </div>

      <div className="results-section">
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'data' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th style={{ textAlign: 'right' }}>Quantidade</th>
                  <th style={{ textAlign: 'right' }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.datafat).toLocaleDateString('pt-BR')}</td>
                      <td style={{ textAlign: 'right' }}>{item.quant}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                        R$ {item.vrtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'servico' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th style={{ textAlign: 'right' }}>Quantidade Total</th>
                  <th style={{ textAlign: 'right' }}>Valor Total Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groupedByService).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.values(groupedByService).map((item: any) => (
                    <tr key={item.nome}>
                      <td style={{ fontWeight: 600 }}>{item.nome}</td>
                      <td style={{ textAlign: 'right' }}>{item.qtd}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                        R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'cliente' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th style={{ textAlign: 'right' }}>Total de Serviços</th>
                  <th style={{ textAlign: 'right' }}>Valor Total Faturado</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groupedByClient).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.values(groupedByClient).map((item: any) => (
                    <tr key={item.nome}>
                      <td style={{ fontWeight: 600 }}>{item.nome}</td>
                      <td style={{ textAlign: 'right' }}>{item.qtd}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                        R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'preco_medio' && (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Tipo Recapagem</th>
                  <th>Medida</th>
                  <th>Desenho</th>
                  <th style={{ textAlign: 'right' }}>Quantidade</th>
                  <th style={{ textAlign: 'right' }}>Valor Total</th>
                  <th style={{ textAlign: 'right' }}>Preço Médio</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByPrecoMedio).length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedByPrecoMedio).map((key) => {
                    const item = groupedByPrecoMedio[key];
                    const precoMedio = item.quantidade > 0 ? item.valorTotal / item.quantidade : 0;
                    return (
                      <tr key={key}>
                        <td style={{ fontWeight: 600 }}>{item.produto}</td>
                        <td>{item.tipo}</td>
                        <td>{item.medida}</td>
                        <td>{item.desenho}</td>
                        <td style={{ textAlign: 'right' }}>{item.quantidade}</td>
                        <td style={{ textAlign: 'right' }}>
                          R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                          R$ {precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {data.length > 0 && (
          <div className="relatorio-footer no-print">
            <div className="total-card">
              <span className="total-label">Total de Registros</span>
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
