import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, X, Printer, Package, 
  User, Truck, Calendar, FileText, Settings, 
  Hash, DollarSign 
} from 'lucide-react';
import api from '../lib/api';
import './OrdemServico.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface OSPneu {
  id?: number;
  id_medida?: number;
  id_marca?: number;
  id_desenho?: number;
  id_servico?: number;
  id_tiporecap?: number;
  serie?: string;
  dot?: string;
  matricula?: string;
  valor: number;
  status_item: string;
}

interface OrdemServico {
  id: number;
  numero_os: string;
  data_emissao: string;
  data_previsao?: string;
  id_cliente: number;
  id_vendedor?: number;
  id_transportadora?: number;
  observacao?: string;
  status: string;
  pneus: OSPneu[];
}

export default function OrdemServico() {
  const [oss, setOss] = useState<OrdemServico[]>([]);
  const [filteredOss, setFilteredOss] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lookups
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [transportadoras, setTransportadoras] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [desenhos, setDesenhos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [tiposRecap, setTiposRecap] = useState<any[]>([]);

  // Modal STate
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    numero_os: '',
    data_previsao: '',
    id_cliente: 0,
    id_vendedor: 0,
    id_transportadora: 0,
    observacao: '',
    status: 'ABERTA',
    pneus: []
  });

  // Pneu Sub-Modal State
  const [isPneuModalOpen, setIsPneuModalOpen] = useState(false);
  const [editingPneuIndex, setEditingPneuIndex] = useState<number | null>(null);
  const [tempPneu, setTempPneu] = useState<OSPneu>({
    id_medida: 0,
    id_marca: 0,
    id_desenho: 0,
    id_servico: 0,
    id_tiporecap: 0,
    serie: '',
    dot: '',
    matricula: '',
    valor: 0,
    status_item: 'AGUARDANDO'
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOss(oss);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredOss(oss.filter(o => 
        o.numero_os.toLowerCase().includes(lowerSearch) || 
        clientes.find(c => c.id === o.id_cliente)?.nome.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, oss, clientes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ordens-servico/');
      setOss(response.data);
    } catch (error) {
      console.error("Erro ao buscar OSs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    // Carregamento resiliente: se um falhar, os outros continuam
    const loadResource = async (path: string, setter: (data: any[]) => void, label: string) => {
      try {
        const response = await api.get(path);
        setter(response.data);
      } catch (error) {
        console.error(`Erro ao buscar ${label}:`, error);
      }
    };

    // Executa as buscas em paralelo, mas sem falhar o todo caso uma falte
    await Promise.allSettled([
      loadResource('/clientes/', setClientes, 'Clientes'),
      loadResource('/vendedores/', setVendedores, 'Vendedores'),
      loadResource('/transportadoras/', setTransportadoras, 'Transportadoras'),
      loadResource('/medidas/', setMedidas, 'Medidas'),
      loadResource('/marcas/', setMarcas, 'Marcas'),
      loadResource('/desenhos/', setDesenhos, 'Desenhos'),
      loadResource('/servicos/', setServicos, 'Serviços'),
      loadResource('/tipo-recapagem/', setTiposRecap, 'Tipos de Recapagem'),
    ]);
  };

  const openModal = (mode: 'create' | 'edit', os?: OrdemServico) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && os) {
      setCurrentId(os.id);
      setFormData({
        numero_os: os.numero_os,
        data_previsao: os.data_previsao ? os.data_previsao.split('T')[0] : '',
        id_cliente: os.id_cliente,
        id_vendedor: os.id_vendedor || 0,
        id_transportadora: os.id_transportadora || 0,
        observacao: os.observacao || '',
        status: os.status,
        pneus: [...os.pneus]
      });
    } else {
      setCurrentId(null);
      setFormData({
        numero_os: '',
        data_previsao: '',
        id_cliente: 0,
        id_vendedor: 0,
        id_transportadora: 0,
        observacao: '',
        status: 'ABERTA',
        pneus: []
      });
    }
    setIsModalOpen(true);
  };

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const openPneuModal = (index: number | null) => {
    if (index !== null) {
      setEditingPneuIndex(index);
      setTempPneu({ ...formData.pneus[index] });
    } else {
      setEditingPneuIndex(null);
      setTempPneu({
        id_medida: 0,
        id_marca: 0,
        id_desenho: 0,
        id_servico: 0,
        id_tiporecap: 0,
        serie: '',
        dot: '',
        matricula: '',
        valor: 0,
        status_item: 'AGUARDANDO'
      });
    }
    setIsPneuModalOpen(true);
  };

  const savePneu = () => {
    const newPneus = [...formData.pneus];
    if (editingPneuIndex !== null) {
      newPneus[editingPneuIndex] = tempPneu;
    } else {
      newPneus.push(tempPneu);
    }
    setFormData((prev: any) => ({ ...prev, pneus: newPneus }));
    setIsPneuModalOpen(false);
  };

  const handleTempPneuChange = (field: string, value: any) => {
    setTempPneu(prev => ({ ...prev, [field]: value }));
  };

  const removePneu = (index: number) => {
    const newPneus = [...formData.pneus];
    newPneus.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, pneus: newPneus }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero_os || !formData.id_cliente) {
      setFormError('Número da OS e Cliente são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload = {
      ...formData,
      id_cliente: parseInt(formData.id_cliente),
      id_vendedor: formData.id_vendedor ? parseInt(formData.id_vendedor) : null,
      id_transportadora: formData.id_transportadora ? parseInt(formData.id_transportadora) : null,
      pneus: formData.pneus.map((p: any) => ({
        ...p,
        id_medida: p.id_medida ? parseInt(p.id_medida) : null,
        id_marca: p.id_marca ? parseInt(p.id_marca) : null,
        id_desenho: p.id_desenho ? parseInt(p.id_desenho) : null,
        id_servico: p.id_servico ? parseInt(p.id_servico) : null,
        id_tiporecap: p.id_tiporecap ? parseInt(p.id_tiporecap) : null,
        valor: parseFloat(p.valor) || 0
      }))
    };

    try {
      if (modalMode === 'create') {
        await api.post('/ordens-servico/', payload);
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/ordens-servico/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar Ordem de Serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, numero: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a OS "${numero}"? Isso excluirá todos os pneus vinculados.`)) {
      try {
        await api.delete(`/ordens-servico/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir OS:", error);
        alert('Erro ao excluir a OS.');
      }
    }
  };


  return (
    <div className="os-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Ordem de Serviço</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Ordens de Serviço</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => window.print()}>
            <Printer size={20} />
            Imprimir Lista
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Nova OS
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
         <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por número ou cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrapper">
          {loading ? (
            <div className="loading-state">Carregando...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Total Itens</th>
                  <th>Valor Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOss.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">Nenhuma Ordem de Serviço encontrada.</td></tr>
                ) : (
                  filteredOss.map(os => (
                    <tr key={os.id}>
                      <td><span className="os-number">#{os.numero_os}</span></td>
                      <td>{new Date(os.data_emissao).toLocaleDateString()}</td>
                      <td>{clientes.find(c => c.id === os.id_cliente)?.nome || 'Carregando...'}</td>
                      <td>
                        <span className={`status-badge status-${os.status.toLowerCase()}`}>
                          {os.status}
                        </span>
                      </td>
                      <td>{os.pneus.length} pneus</td>
                      <td>R$ {os.pneus.reduce((s,p) => s + (p.valor || 0), 0).toFixed(2)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', os)} title="Editar"><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(os.id, os.numero_os)} title="Excluir"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content full-screen" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <FileText className="header-icon" />
                <h2>{modalMode === 'create' ? 'Configurar Nova Ordem de Serviço' : `Editando OS #${formData.numero_os}`}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="os-form">
              <div className="modal-body scrollable">
                {formError && <div className="form-error">{formError}</div>}
                
                {/* MESTRE (CABEÇALHO) */}
                <div className="os-master-section">
                   <div className="form-grid-os">
                      <div className="form-group">
                        <label><Hash size={14} /> Número OS *</label>
                        <input className="form-input" id="numero_os" value={formData.numero_os} onChange={handleMasterChange} required />
                      </div>
                      <div className="form-group">
                        <label><Calendar size={14} /> Previsão Entrega</label>
                        <input className="form-input" type="date" id="data_previsao" value={formData.data_previsao} onChange={handleMasterChange} />
                      </div>
                      <div className="form-group">
                        <label><Settings size={14} /> Status</label>
                        <select className="form-input" id="status" value={formData.status} onChange={handleMasterChange}>
                          <option value="ABERTA">ABERTA</option>
                          <option value="PRODUCAO">EM PRODUÇÃO</option>
                          <option value="FINALIZADA">FINALIZADA</option>
                          <option value="CANCELADA">CANCELADA</option>
                        </select>
                      </div>

                      <div className="form-group span-2">
                        <label><User size={14} /> Cliente *</label>
                        <select className="form-input" id="id_cliente" value={formData.id_cliente} onChange={handleMasterChange} required>
                          <option value="">Selecione um cliente...</option>
                          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Vendedor</label>
                        <select className="form-input" id="id_vendedor" value={formData.id_vendedor} onChange={handleMasterChange}>
                          <option value="0">Sem vendedor</option>
                          {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label><Truck size={14} /> Transportadora</label>
                        <select className="form-input" id="id_transportadora" value={formData.id_transportadora} onChange={handleMasterChange}>
                          <option value="0">FOB (Sem transp.)</option>
                          {transportadoras.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                      </div>

                      <div className="form-group span-4">
                        <label>Observações</label>
                        <textarea className="form-input" id="observacao" value={formData.observacao} onChange={handleMasterChange} rows={2} />
                      </div>
                   </div>
                </div>

                {/* DETALHE (GRADE DE PNEUS) */}
                <div className="os-detail-section">
                  <div className="section-title-bar">
                    <div className="title-left">
                      <Package size={18} />
                      <h3>Itens da OS (Pneus)</h3>
                      <span className="item-count">{formData.pneus.length} pneus adicionados</span>
                    </div>
                    <button type="button" className="btn-add-item" onClick={() => openPneuModal(null)}>
                      <Plus size={16} /> Adicionar Pneu
                    </button>
                  </div>

                  <div className="pneus-grid-container">
                    <table className="pneus-table readonly">
                      <thead>
                        <tr>
                          <th>Medida / Marca</th>
                          <th>Desenho / Serviço</th>
                          <th>Recapagem</th>
                          <th>Série / DOT / Fogo</th>
                          <th>Valor (R$)</th>
                          <th>Status</th>
                          <th style={{ width: '100px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.pneus.length === 0 ? (
                          <tr><td colSpan={7} className="empty-pneus">Nenhum pneu adicionado a esta OS.</td></tr>
                        ) : (
                          formData.pneus.map((p: any, idx: number) => (
                            <tr key={idx}>
                              <td>
                                <div className="pneu-info-cell">
                                  <span className="primary-info">{medidas.find(m => m.id === parseInt(p.id_medida))?.descricao || '---'}</span>
                                  <span className="secondary-info">{marcas.find(m => m.id === parseInt(p.id_marca))?.descricao || '---'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="pneu-info-cell">
                                  <span className="primary-info">{desenhos.find(d => d.id === parseInt(p.id_desenho))?.descricao || '---'}</span>
                                  <span className="secondary-info">{servicos.find(s => s.id === parseInt(p.id_servico))?.descricao || '---'}</span>
                                </div>
                              </td>
                              <td>{tiposRecap.find(tr => tr.id === parseInt(p.id_tiporecap))?.descricao || '---'}</td>
                              <td>
                                <div className="pneu-info-cell">
                                  <span className="badge-info">SÉRIE: {p.serie || '---'}</span>
                                  <span className="badge-info">DOT: {p.dot || '---'}</span>
                                  <span className="badge-info highlight">FOGO: {p.matricula || '---'}</span>
                                </div>
                              </td>
                              <td className="valor-cell-readonly">R$ {parseFloat(p.valor).toFixed(2)}</td>
                              <td>
                                <span className={`status-badge-item status-${p.status_item.toLowerCase()}`}>
                                  {p.status_item}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons-inline">
                                  <button type="button" className="icon-btn edit" onClick={() => openPneuModal(idx)} title="Editar"><Edit2 size={16} /></button>
                                  <button type="button" className="icon-btn delete" onClick={() => removePneu(idx)} title="Excluir"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid-summary-bar">
                    <div className="os-summary">
                      <div className="summary-item">
                        <span className="label">Total Itens</span>
                        <span className="value">{formData.pneus.length} pneu(s)</span>
                      </div>
                      <div className="summary-item total">
                        <span className="label">Valor Total</span>
                        <span className="value">R$ {formData.pneus.reduce((acc: number, p: any) => acc + parseFloat(p.valor || 0), 0).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button type="button" className="btn-secondary-compact" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer-os">
                <div style={{ flex: 1 }}></div>
                <div className="footer-btns">
                  <button type="submit" className="btn-primary-os" disabled={isSubmitting}>
                    {isSubmitting ? 'Processando...' : (modalMode === 'create' ? 'Emitir Ordem de Serviço' : 'Salvar Alterações')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isPneuModalOpen && (
        <div className="modal-overlay sub-modal" onClick={() => setIsPneuModalOpen(false)}>
          <div className="modal-content pneu-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <Package className="header-icon" />
                <h2>{editingPneuIndex !== null ? 'Editar Detalhes do Pneu' : 'Adicionar Novo Pneu'}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsPneuModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="modal-body">
              <div className="pneu-form-grid">
                <div className="form-group span-2">
                  <label>Medida *</label>
                  <select className="form-input" value={tempPneu.id_medida} onChange={(e) => handleTempPneuChange('id_medida', e.target.value)}>
                    <option value="0">Selecione a medida...</option>
                    {medidas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Marca *</label>
                  <select className="form-input" value={tempPneu.id_marca} onChange={(e) => handleTempPneuChange('id_marca', e.target.value)}>
                    <option value="0">Selecione a marca...</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Desenho</label>
                  <select className="form-input" value={tempPneu.id_desenho} onChange={(e) => handleTempPneuChange('id_desenho', e.target.value)}>
                    <option value="0">Selecione o desenho...</option>
                    {desenhos.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Tipo de Recapagem</label>
                  <select className="form-input" value={tempPneu.id_tiporecap} onChange={(e) => handleTempPneuChange('id_tiporecap', e.target.value)}>
                    <option value="0">Selecione o tipo...</option>
                    {tiposRecap.map(tr => <option key={tr.id} value={tr.id}>{tr.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-4">
                  <label>Serviço Principal</label>
                  <select className="form-input" value={tempPneu.id_servico} onChange={(e) => handleTempPneuChange('id_servico', e.target.value)}>
                    <option value="0">Selecione o serviço...</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>DOT</label>
                  <input className="form-input uppercase" placeholder="Sem DOT" value={tempPneu.dot} onChange={(e) => handleTempPneuChange('dot', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group">
                  <label>Série</label>
                  <input className="form-input uppercase" placeholder="Sem Série" value={tempPneu.serie} onChange={(e) => handleTempPneuChange('serie', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group">
                  <label>Número Fogo (Matrícula)</label>
                  <input className="form-input highlight-field" placeholder="0000" value={tempPneu.matricula} onChange={(e) => handleTempPneuChange('matricula', e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Valor do Serviço (R$)</label>
                  <div className="input-with-icon">
                    <DollarSign size={16} className="field-icon" />
                    <input className="form-input" type="number" step="0.01" value={tempPneu.valor} onChange={(e) => handleTempPneuChange('valor', e.target.value)} />
                  </div>
                </div>

                <div className="form-group span-4">
                  <label>Status do Item</label>
                  <select className="form-input" value={tempPneu.status_item} onChange={(e) => handleTempPneuChange('status_item', e.target.value)}>
                    <option value="AGUARDANDO">AGUARDANDO</option>
                    <option value="PROCESSO">EM PROCESSO</option>
                    <option value="PRONTO">PRONTO</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsPneuModalOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={savePneu}>
                {editingPneuIndex !== null ? 'Atualizar Pneu' : 'Confirmar Pneu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
