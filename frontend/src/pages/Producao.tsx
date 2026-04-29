import { useState, useEffect } from 'react';
import { Search, Monitor, Package, User, Hash, FileText, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import './Producao.css';

interface OSPneu {
  id: number;
  id_medida: number;
  id_produto: number;
  id_desenho: number;
  id_recap: number;
  id_servico: number;
  statuspro: boolean;
  statusfat: boolean;
  statuspro_label?: string;
  valor: number;
  numserie?: string;
  numfogo?: string;
  dot?: string;
  obs?: string;
  qservico: number;
}

interface OrdemServico {
  id: number;
  numos: number;
  id_contato: number;
  dataentrada: string;
  status: string;
  contato_nome?: string;
  pneus: OSPneu[];
}

export default function Producao() {
  const [searchParams, setSearchParams] = useState({
    id: '',
    numos: '',
    cliente: ''
  });
  const [loading, setLoading] = useState(false);
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [error, setError] = useState('');
  const [pneuFilter, setPneuFilter] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Estados do Autocomplete
  const [filteredClientes, setFilteredClientes] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [multipleOsOptions, setMultipleOsOptions] = useState<any[]>([]);
  const [showOsSelector, setShowOsSelector] = useState(false);

  // Lookups para tradução de IDs em nomes
  const [clientes, setClientes] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [desenhos, setDesenhos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [tiposRecap, setTiposRecap] = useState<any[]>([]);

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const [c, m, mk, d, s] = await Promise.all([
        api.get('/clientes/'),
        api.get('/medidas/'),
        api.get('/produtos/'),
        api.get('/desenhos/'),
        api.get('/servicos/')
      ]);
      setClientes(c.data);
      setMedidas(m.data);
      setProdutos(mk.data);
      setDesenhos(d.data);
      setServicos(s.data);
      const tr = await api.get('/tipo-recapagem/');
      setTiposRecap(tr.data);
    } catch (err) {
      console.error("Erro ao carregar lookups:", err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOs(null);

    try {
      // Busca OS por ID ou NumOS/Cliente (query q)
      if (searchParams.id) {
        const response = await api.get(`/ordens-servico/${searchParams.id}`);
        setOs(response.data);
      } else if (searchParams.numos || searchParams.cliente) {
        const query_str = searchParams.numos || searchParams.cliente;
        const isClientSearch = !!searchParams.cliente && !searchParams.numos;
        const response = await api.get(`/ordens-servico/?q=${encodeURIComponent(query_str)}${isClientSearch ? '&latest=true' : ''}`);
        
        if (response.data && response.data.length > 0) {
          if (response.data.length === 1) {
            // Apenas uma encontrada, carrega direto
            const found = response.data[0];
            const detailRes = await api.get(`/ordens-servico/${found.id}`);
            setOs(detailRes.data);
            setMultipleOsOptions([]);
            setShowOsSelector(false);
          } else {
            // Múltiplas encontradas (caso o filtro retorne mais de uma, embora latest=true no backend limite a 1)
            setMultipleOsOptions(response.data);
            setShowOsSelector(true);
            setOs(null);
          }
        } else {
          setError('Nenhuma Ordem de Serviço encontrada com os critérios informados.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao buscar Ordem de Serviço.');
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificOs = async (osId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/ordens-servico/${osId}`);
      setOs(response.data);
      setShowOsSelector(false);
      setMultipleOsOptions([]);
      setHasChanges(false);
    } catch (err: any) {
      setError('Erro ao carregar detalhes da OS selecionada.');
    } finally {
      setLoading(false);
    }
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchParams({ ...searchParams, cliente: value, id: '', numos: '' });

    if (value.length >= 2) {
      const filtered = clientes.filter(c => 
        c.nome.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Limite de 8 sugestões
      setFilteredClientes(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCliente = (clienteNome: string) => {
    setSearchParams({ ...searchParams, cliente: clienteNome, id: '', numos: '' });
    setShowSuggestions(false);
    
    // Dispara a busca automaticamente ao selecionar
    // Usamos setTimeout para garantir que o estado searchParams esteja atualizado no closure ou passamos direto
    setTimeout(() => {
        document.getElementById('search-form-prod')?.dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
        );
    }, 50);
  };
  
  const handleToggleStatus = (pneuId: number) => {
    if (!os) return;
    
    const updatedPneus = os.pneus.map(p => {
      if (p.id === pneuId) {
        return { ...p, statuspro: !p.statuspro, _modified: true };
      }
      return p;
    });
    
    setOs({ ...os, pneus: updatedPneus });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSaveProduction = async () => {
    if (!os || isSaving) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      // Prepara apenas os dados necessários para o update
      const payload = {
        pneus: os.pneus.map(p => ({
          id: p.id,
          statuspro: p.statuspro,
          statusfat: p.statusfat
        }))
      };
      
      await api.put(`/ordens-servico/${os.id}`, payload);
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Limpa flag de modificado local
      const cleanedPneus = os.pneus.map(p => ({ ...p, _modified: false }));
      setOs({ ...os, pneus: cleanedPneus });
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar alterações de produção.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="producao-container">
      <div className="page-header-producao">
        <div className="header-title-group">
          <Monitor className="header-icon" />
          <div>
            <h1>Controle de Produção</h1>
            <p>Identifique a OS para iniciar o processamento dos pneus</p>
          </div>
        </div>
      </div>

      <div className="search-section glass-panel">
        <form id="search-form-prod" onSubmit={handleSearch} className="search-form-producao">
          <div className="search-grid">
            <div className="form-group">
              <label><Hash size={14} /> ID Interno</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Ex: 45" 
                value={searchParams.id}
                onChange={(e) => setSearchParams({...searchParams, id: e.target.value, numos: '', cliente: ''})}
              />
            </div>
            <div className="form-group">
              <label><FileText size={14} /> Número da OS</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: 5020" 
                value={searchParams.numos}
                onChange={(e) => setSearchParams({...searchParams, numos: e.target.value, id: '', cliente: ''})}
              />
            </div>
            <div className="form-group span-2 relative">
              <label><User size={14} /> Nome do Cliente</label>
              <div className="input-with-button">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Iniciais do nome..." 
                  value={searchParams.cliente}
                  onChange={handleClienteChange}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <button type="submit" className="btn-search-producao" disabled={loading}>
                  {loading ? 'Buscando...' : <><Search size={18} /> Identificar OS</>}
                </button>
              </div>

              {showSuggestions && filteredClientes.length > 0 && (
                <div className="suggestions-dropdown glass-panel">
                  {filteredClientes.map(c => (
                    <div 
                      key={c.id} 
                      className="suggestion-item"
                      onClick={() => selectCliente(c.nome)}
                    >
                      <User size={14} className="icon" />
                      <span>{c.nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
        {error && <div className="search-error">{error}</div>}
      </div>

      {showOsSelector && multipleOsOptions.length > 0 && (
        <div className="os-selector-area animate-fade-in">
          <div className="selector-title">
            <FileText size={20} />
            <h3>Múltiplas Ordens de Serviço encontradas. Selecione uma:</h3>
          </div>
          <div className="os-options-grid">
            {multipleOsOptions.map(option => (
              <div 
                key={option.id} 
                className="os-option-card glass-panel"
                onClick={() => loadSpecificOs(option.id)}
              >
                <div className="option-header">
                  <span className="option-num">OS #{option.numos}</span>
                  <span className={`option-status status-${option.status.toLowerCase()}`}>
                    {option.status}
                  </span>
                </div>
                <div className="option-body">
                  <div className="info">
                    <User size={14} />
                    <span>{option.contato_nome || 'Cliente não identificado'}</span>
                  </div>
                  <div className="info">
                    <Calendar size={14} />
                    <span>{option.dataentrada ? new Date(option.dataentrada).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="info">
                    <Package size={14} />
                    <span>{option.total_pneus || 0} pneus</span>
                  </div>
                </div>
                <div className="option-footer">
                   <span>Clique para selecionar</span>
                   <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
          <button className="btn-cancel-selection" onClick={() => setShowOsSelector(false)}>
            Cancelar e pesquisar novamente
          </button>
        </div>
      )}

      {os && (
        <div className="os-identified-area animate-fade-in">
          <div className="os-summary-header glass-panel">
            <div className="os-badge">OS #{os.numos}</div>
            <div className="os-info-grid">
              <div className="info-item">
                <span className="label">Cliente</span>
                <span className="value">{clientes.find(c => c.id === os.id_contato)?.nome || `ID: ${os.id_contato}`}</span>
              </div>
              <div className="info-item">
                <span className="label">Data Entrada</span>
                <span className="value">{new Date(os.dataentrada).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Status Atual</span>
                <span className={`status-pill ${os.status.toLowerCase()}`}>{os.status}</span>
              </div>
            </div>
          </div>

          <div className="production-items-section">
            <div className="section-title-row">
              <div className="section-title">
                <Package size={20} />
                <h3>Itens em Produção ({os.pneus.filter(p => !p.statusfat).length})</h3>
              </div>
              <div className="pneu-search-filter glass-panel">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Filtrar por medida, desenho, série ou fogo..." 
                  value={pneuFilter}
                  onChange={(e) => setPneuFilter(e.target.value)}
                />
              </div>
              {hasChanges && (
                <button 
                  className={`btn-save-production animate-bounce-subtle ${isSaving ? 'loading' : ''}`}
                  onClick={handleSaveProduction}
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : <><Package size={18} /> Salvar Alterações</>}
                </button>
              )}
              {saveSuccess && (
                <div className="save-success-badge">
                  Alterações salvas com sucesso!
                </div>
              )}
            </div>

            <div className="production-grid-wrapper glass-panel">
              <table className="production-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Nº OS</th>
                    <th>Medida / Produto</th>
                    <th>Desenho</th>
                    <th>Recapagem</th>
                    <th>DOT</th>
                    <th>Nº Série</th>
                    <th>Nº Fogo</th>
                    <th className="center">StatPro</th>
                    <th className="center">StatFat</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {os.pneus
                    .filter(pneu => !pneu.statusfat) // Oculta faturados
                    .filter(pneu => {
                      if (!pneuFilter) return true;
                      const search = pneuFilter.toLowerCase();
                      const medida = medidas.find(m => m.id === pneu.id_medida)?.descricao?.toLowerCase() || '';
                      const desenho = desenhos.find(d => d.id === pneu.id_desenho)?.descricao?.toLowerCase() || '';
                      const serie = (pneu.numserie || '').toLowerCase();
                      const fogo = (pneu.numfogo || '').toLowerCase();
                      
                      return medida.includes(search) || 
                             desenho.includes(search) || 
                             serie.includes(search) || 
                             fogo.includes(search);
                    })
                    .map((pneu) => (
                    <tr 
                      key={pneu.id} 
                      className={`${(pneu as any)._modified ? 'row-modified' : ''}`}
                      onDoubleClick={() => handleToggleStatus(pneu.id)}
                    >
                      <td>{new Date(os.dataentrada).toLocaleDateString()}</td>
                      <td><span className="os-number-cell">#{os.numos}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{medidas.find(m => m.id === pneu.id_medida)?.descricao || pneu.id_medida}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{produtos.find(m => m.id === pneu.id_produto)?.nome || '---'}</span>
                        </div>
                      </td>
                      <td>{desenhos.find(d => d.id === pneu.id_desenho)?.descricao || pneu.id_desenho}</td>
                      <td>{tiposRecap.find(t => t.id === pneu.id_recap)?.descricao || pneu.id_recap}</td>
                      <td>{pneu.dot || '-'}</td>
                      <td>{pneu.numserie || '-'}</td>
                      <td>{pneu.numfogo || '-'}</td>
                      <td 
                        className="center clickable-cell" 
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(pneu.id); }}
                        style={{ fontWeight: 'bold', color: pneu.statuspro ? '#10b981' : '#dc2626' }}
                      >
                        {pneu.statuspro ? 'Sim' : 'Não'}
                      </td>
                      <td className="center" style={{ fontWeight: 'bold', color: pneu.statusfat ? '#2563eb' : '#dc2626' }}>
                        {pneu.statusfat ? 'Sim' : 'Não'}
                      </td>
                      <td>
                        <button className="icon-btn-prod" title="Processar" onClick={() => handleToggleStatus(pneu.id)}>
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
