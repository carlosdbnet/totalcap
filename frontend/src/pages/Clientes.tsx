import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye, Printer, User, Home, Mail, DollarSign, Users, BookOpen } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Clientes.css';

interface Endereco {
  id?: number;
  tipo: string;
  rua: string;
  numcasa: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
}

interface ContatoEmail {
  id?: number;
  email: string;
  tipo: string;
  ativo: boolean;
}

interface Cliente {
  id: number;
  nome: string;
  razaosocial: string;
  cpfcnpj: string;
  pessoa: string;
  rg: string;
  emitenterg: string;
  inscestadual: string;
  inscmunicipio: string;
  tipodoc: string;
  cxpostal: string;
  codigopais: string;
  nomepais: string;
  rua: string;
  numcasa: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  foneprincipal: string;
  email: string;
  emailnfe: string;
  site: string;
  contato_comercial: string;
  celular_comercial: string;
  contato_financeiro: string;
  celular_financeiro: string;
  nomepai: string;
  nomemae: string;
  nomeconjuge: string;
  rgconjuge: string;
  datanascto: string;
  nasctoconjuge: string;
  sexo: string;
  ecivil: string;
  limicredito: number;
  prazomax: number;
  diafat: number;
  conceito: string;
  datapricompra: string;
  dataultcompra: string;
  numcompra: number;
  valpricompra: number;
  valmaicompra: number;
  valultcompra: number;
  datacad: string;
  dataspc: string;
  obs: string;
  ref_spc: string;
  ref_fin: string;
  ref_com: string;
  ref_prod: string;
  codigoibge?: number;
  id_area?: number;
  id_regiao?: number;
  id_vendedor?: number;
  id_atividade?: number;
  id_banco?: number;
  contribuinte: boolean;
  consumidor: boolean;
  flagcliente: boolean;
  flagfornecedor: boolean;
  flagtranspotador: boolean;
  flagcolaborador: boolean;
  flagvendedor: boolean;
  ativo: boolean;
  enderecos: Endereco[];
  emails: ContatoEmail[];
}

interface LookupItem {
  id: number;
  nome: string;
  codigoibge?: number;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('geral');
  const [selectedClienteIds, setSelectedClienteIds] = useState<number[]>([]);
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [searchingCNPJ, setSearchingCNPJ] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Lookup data
  const [listCidades, setListCidades] = useState<LookupItem[]>([]);
  const [listAreas, setListAreas] = useState<LookupItem[]>([]);
  const [listRegioes, setListRegioes] = useState<LookupItem[]>([]);
  const [listVendedores, setListVendedores] = useState<LookupItem[]>([]);
  const [listAtividades, setListAtividades] = useState<LookupItem[]>([]);
  const [listBancos, setListBancos] = useState<LookupItem[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [editingEnderecoIdx, setEditingEnderecoIdx] = useState<number | null>(null);
  
  // Default structure for a new contact
  const defaultValues: Partial<Cliente> = {
    nome: '',
    razaosocial: '',
    cpfcnpj: '',
    pessoa: 'F',
    rg: '',
    emitenterg: '',
    inscestadual: '',
    inscmunicipio: '',
    tipodoc: '',
    cxpostal: '',
    codigopais: '',
    nomepais: '',
    rua: '',
    numcasa: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    uf: '',
    foneprincipal: '',
    email: '',
    emailnfe: '',
    site: '',
    contato_comercial: '',
    celular_comercial: '',
    contato_financeiro: '',
    celular_financeiro: '',
    nomepai: '',
    nomemae: '',
    nomeconjuge: '',
    rgconjuge: '',
    datanascto: '',
    nasctoconjuge: '',
    sexo: 'M',
    ecivil: 'S',
    limicredito: 0,
    prazomax: 0,
    diafat: 0,
    conceito: '',
    datapricompra: '',
    dataultcompra: '',
    numcompra: 0,
    valpricompra: 0,
    valmaicompra: 0,
    valultcompra: 0,
    datacad: '',
    dataspc: '',
    obs: '',
    ref_spc: '',
    ref_fin: '',
    ref_com: '',
    ref_prod: '',
    codigoibge: undefined,
    id_area: '',
    id_regiao: '',
    id_vendedor: '',
    id_atividade: '',
    id_banco: '',
    contribuinte: true,
    consumidor: true,
    flagcliente: true,
    flagfornecedor: false,
    flagtranspotador: false,
    flagcolaborador: false,
    flagvendedor: false,
    ativo: true,
    enderecos: [],
    emails: []
  };

  const [formData, setFormData] = useState<Partial<Cliente>>(defaultValues);
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const [cid, area, reg, vend, ativ, bank] = await Promise.all([
        api.get('/cidades/'),
        api.get('/areas/'),
        api.get('/regioes/'),
        api.get('/vendedores/'),
        api.get('/atividades/'),
        api.get('/bancos/')
      ]);
      setListCidades(cid.data);
      setListAreas(area.data);
      setListRegioes(reg.data);
      setListVendedores(vend.data);
      // Atividades use 'descricao' instead of 'nome', so map it to LookupItem format
      setListAtividades(ativ.data.map((item: any) => ({ id: item.id, nome: item.descricao })));
      setListBancos(bank.data);
    } catch (error) {
      console.error("Erro ao buscar lookups:", error);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClientes(clientes);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredClientes(clientes.filter(c => 
        c.nome.toLowerCase().includes(lowerSearch) ||
        (c.cpfcnpj && c.cpfcnpj.includes(lowerSearch))
      ));
    }
  }, [searchTerm, clientes]);

  // Paginated Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes/');
      setClientes(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClienteSelection = (id: number) => {
    setSelectedClienteIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAllClientes = () => {
    if (selectedClienteIds.length === filteredClientes.length && filteredClientes.length > 0) {
      setSelectedClienteIds([]);
    } else {
      setSelectedClienteIds(filteredClientes.map(c => c.id));
    }
  };

  const handleCNPJSearch = async () => {
    const doc = formData.cpfcnpj?.replace(/\D/g, '');
    if (!doc || doc.length !== 14) {
      alert("Busca de dados disponível apenas para CNPJ (14 dígitos).");
      return;
    }

    setSearchingCNPJ(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${doc}`);
      if (!response.ok) {
        alert("CNPJ não encontrado ou erro na consulta.");
        return;
      }
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        nome: data.razao_social || prev.nome,
        razaosocial: data.nome_fantasia || prev.razaosocial,
        rua: data.logradouro || prev.rua,
        numcasa: data.numero || prev.numcasa,
        complemento: data.complemento || prev.complemento,
        bairro: data.bairro || prev.bairro,
        cep: data.cep ? data.cep.replace(/\D/g, '') : prev.cep,
        cidade: data.municipio || prev.cidade,
        uf: data.uf || prev.uf,
        foneprincipal: data.ddd_telefone_1 || prev.foneprincipal,
        email: data.email || prev.email
      }));
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
      alert("Erro ao consultar CNPJ. Tente novamente mais tarde.");
    } finally {
      setSearchingCNPJ(false);
    }
  };

  const handleCEPSearch = async () => {
    const cep = formData.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      alert("CEP deve ter 8 dígitos.");
      return;
    }

    setSearchingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        alert("CEP não encontrado.");
      } else {
        setFormData(prev => ({
          ...prev,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setSearchingCEP(false);
    }
  };

  const handleNestedCEPSearch = async (index: number) => {
    const cep = formData.enderecos[index].cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      alert("CEP deve ter 8 dígitos.");
      return;
    }

    setSearchingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        alert("CEP não encontrado.");
      } else {
        const newEnderecos = [...(formData.enderecos || [])];
        newEnderecos[index] = {
          ...newEnderecos[index],
          rua: data.logradouro || newEnderecos[index].rua,
          bairro: data.bairro || newEnderecos[index].bairro,
          cidade: data.localidade || newEnderecos[index].cidade,
          uf: data.uf || newEnderecos[index].uf
        };
        setFormData(prev => ({
          ...prev,
          enderecos: newEnderecos
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP adicional:", error);
    } finally {
      setSearchingCEP(false);
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', cliente?: Cliente) => {
    setModalMode(mode);
    setFormError('');
    setActiveTab('geral');
    if ((mode === 'edit' || mode === 'view') && cliente) {
      setCurrentId(cliente.id);
      setFormData({
        ...cliente,
        datanascto: cliente.datanascto ? cliente.datanascto.split('T')[0] : '',
        nasctoconjuge: cliente.nasctoconjuge ? cliente.nasctoconjuge.split('T')[0] : '',
        datapricompra: cliente.datapricompra ? cliente.datapricompra.split('T')[0] : '',
        dataultcompra: cliente.dataultcompra ? cliente.dataultcompra.split('T')[0] : '',
        datacad: cliente.datacad ? cliente.datacad.split('T')[0] : '',
        dataspc: cliente.dataspc ? cliente.dataspc.split('T')[0] : '',
      });
    } else {
      setCurrentId(null);
      setFormData(defaultValues);
    }
    setIsModalOpen(true);
  };


  const maskCPFCNPJ = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
    }
    return v.substring(0, 18);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (modalMode === 'view') return;
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let finalValue: any = type === 'checkbox' ? checked : value;

    if (id === 'cpfcnpj' && typeof finalValue === 'string') {
      finalValue = maskCPFCNPJ(finalValue);
    }

    setFormData(prev => ({
      ...prev,
      [id]: finalValue
    }));
  };

  const handleAddEndereco = () => {
    const newIdx = (formData.enderecos || []).length;
    setFormData(prev => ({
      ...prev,
      enderecos: [...(prev.enderecos || []), { tipo: 'Entrega', rua: '', numcasa: '', complemento: '', bairro: '', cep: '', cidade: '', uf: '' }]
    }));
    setEditingEnderecoIdx(newIdx);
  };

  const handleRemoveEndereco = (index: number) => {
    setFormData(prev => ({
      ...prev,
      enderecos: (prev.enderecos || []).filter((_, i) => i !== index)
    }));
  };

  const handleEnderecoChange = (index: number, field: string, value: string) => {
    const newEnderecos = [...(formData.enderecos || [])];
    (newEnderecos[index] as any)[field] = value;
    setFormData(prev => ({
      ...prev,
      enderecos: newEnderecos
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.nome.trim()) {
      setFormError('Nome é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    // Sanitize: convert empty date strings to null to avoid Pydantic 422
    const dateFields = ['datanascto', 'nasctoconjuge', 'datapricompra', 'dataultcompra', 'datacad', 'dataspc'];
    const payload = { ...formData };
    for (const field of dateFields) {
      const val = (payload as any)[field];
      if (val === '' || val === undefined) {
        (payload as any)[field] = null;
      }
    }

    try {
      if (modalMode === 'create') {
        await api.post('/clientes/', payload);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/clientes/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar cliente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clientes-container">
      <div className="page-header">
        <h1 className="title">Gestão de Clientes</h1>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            style={{ background: '#10b981' }}
            onClick={() => {
              if (selectedClienteIds.length === 0) return alert("Selecione clientes para exportar.");
              alert(`Exportando ${selectedClienteIds.length} clientes via API...`);
            }}
          >
            <Users size={20} /> Exporta API
          </button>
          <button 
            className="btn-secondary" 
            style={{ background: '#3b82f6', color: 'white' }}
            onClick={() => alert("Iniciando importação de clientes via API...")}
          >
            <Search size={20} /> Importa API
          </button>
          <button className="btn-print" onClick={() => window.print()}><Printer size={20} /> Imprimir</button>
          <button className="btn-primary" onClick={() => openModal('create')}><Plus size={20} /> Novo Cliente</button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF/CNPJ..." 
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
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={filteredClientes.length > 0 && selectedClienteIds.length === filteredClientes.length}
                      onChange={handleSelectAllClientes}
                    />
                  </th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Cidade/UF</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                 {currentItems.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">Nenhum cliente encontrado.</td></tr>
                ) : (
                    currentItems.map(c => (
                    <tr key={c.id} style={{ background: selectedClienteIds.includes(c.id) ? 'rgba(37, 99, 235, 0.05)' : 'transparent' }}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedClienteIds.includes(c.id)}
                          onChange={() => handleToggleClienteSelection(c.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td>
                        <div className="servico-info">
                          <span className="servico-desc">{c.nome}</span>
                          <span className="servico-sub">{c.email}</span>
                        </div>
                      </td>
                      <td>{c.cpfcnpj}</td>
                      <td>{c.cidade || '-'}/{c.uf || '-'}</td>
                      <td>{c.foneprincipal || '-'}</td>
                      <td>
                        <span className={`status-badge ${c.ativo ? 'active' : 'inactive'}`}>
                          {c.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            className="btn-icon-premium success" 
                            title="Visualizar" 
                            onClick={() => openModal('view', c)}
                            style={{ background: '#10b981', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="btn-icon-premium edit" 
                            title="Editar"
                            onClick={() => openModal('edit', c)}
                            style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon-premium delete" 
                            title="Excluir"
                            onClick={() => {/* Delete logic */}}
                            style={{ background: '#ef4444', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {!loading && filteredClientes.length > itemsPerPage && (
          <div className="pagination-container" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1.5rem 2rem',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div className="pagination-info" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a <strong>{Math.min(indexOfLastItem, filteredClientes.length)}</strong> de <strong>{filteredClientes.length}</strong> clientes
            </div>
            <div className="pagination-controls" style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn-secondary" 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                style={{ padding: '0.5rem 1rem' }}
              >
                Anterior
              </button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontWeight: 'bold' }}>
                Página {currentPage} de {totalPages}
              </div>
              <button 
                className="btn-secondary" 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                style={{ padding: '0.5rem 1rem' }}
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="premium-modal-content large" style={{ maxWidth: '1000px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Cliente' : (modalMode === 'edit' ? 'Editar Cliente' : 'Visualizar Cliente')}</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {(modalMode === 'edit' || modalMode === 'view') && (
                  <button type="button" className="btn-print" onClick={() => window.print()}>
                    <Printer size={18} /> Imprimir Cliente
                  </button>
                )}
                <button type="button" className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
            </div>
            
            <div className="modal-tabs">
              <button type="button" className={`tab-btn ${activeTab === 'geral' ? 'active' : ''}`} onClick={() => setActiveTab('geral')}><User size={16} /> Geral</button>
              <button type="button" className={`tab-btn ${activeTab === 'enderecos' ? 'active' : ''}`} onClick={() => setActiveTab('enderecos')}><Home size={16} /> Endereços</button>
              <button type="button" className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}><Users size={16} /> Social / Cônjuge</button>
              <button type="button" className={`tab-btn ${activeTab === 'financeiro' ? 'active' : ''}`} onClick={() => setActiveTab('financeiro')}><DollarSign size={16} /> Financeiro</button>
              <button type="button" className={`tab-btn ${activeTab === 'referencias' ? 'active' : ''}`} onClick={() => setActiveTab('referencias')}><BookOpen size={16} /> Referências</button>
              <button type="button" className={`tab-btn ${activeTab === 'contatos' ? 'active' : ''}`} onClick={() => setActiveTab('contatos')}><Mail size={16} /> Contatos & Flags</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form-scroll">
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                {activeTab === 'geral' && (
                  <div className="tab-content" style={{ padding: '2rem' }}>
                    {/* SEÇÃO 1: IDENTIFICAÇÃO */}
                    <div className="premium-master-panel">
                      <div className="premium-section-title"><User size={18} /> Identificação Principal</div>
                    <div className="grid-4">
                        <div className="form-group span-2">
                            <label>Nome / Razão Social *</label>
                            <input className="form-input" id="nome" value={formData.nome || ''} onChange={handleChange} placeholder="Nome completo ou Razão Social" required />
                        </div>
                        <div className="form-group span-2">
                            <label>Nome Fantasia</label>
                            <input className="form-input" id="razaosocial" value={formData.razaosocial || ''} onChange={handleChange} placeholder="Apelido ou Fantasia" />
                        </div>
                        <div className="form-group">
                            <label>Pessoa</label>
                            <select className="form-select" id="pessoa" value={formData.pessoa || 'F'} onChange={handleChange}>
                                <option value="F">Física</option>
                                <option value="J">Jurídica</option>
                            </select>
                        </div>
                        <div className="form-group span-2">
                            <label>CPF / CNPJ *</label>
                            <div className="input-with-button">
                                <input className="form-input" id="cpfcnpj" value={formData.cpfcnpj || ''} onChange={handleChange} required />
                                <button type="button" className="btn-search-premium" onClick={handleCNPJSearch} disabled={searchingCNPJ} title="Buscar CNPJ">
                                    {searchingCNPJ ? '...' : <Search size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>RG / Documento</label>
                            <input className="form-input" id="rg" value={formData.rg || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Órgão Emissor</label>
                            <input className="form-input" id="emitenterg" value={formData.emitenterg || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Inscrição Estadual</label>
                            <input className="form-input" id="inscestadual" value={formData.inscestadual || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Inscrição Municipal</label>
                            <input className="form-input" id="inscmunicipio" value={formData.inscmunicipio || ''} onChange={handleChange} />
                        </div>
                    </div>

                    </div>
                    
                    <div className="premium-master-panel">
                        <div className="premium-section-title"><Home size={18} /> Localização e Contato</div>
                    <div className="grid-4">
                        <div className="form-group">
                            <label>CEP</label>
                            <div className="input-with-button">
                                <input className="form-input" id="cep" value={formData.cep || ''} onChange={handleChange} placeholder="00000-000" />
                                <button type="button" className="btn-search-premium" onClick={handleCEPSearch} disabled={searchingCEP}>
                                    {searchingCEP ? '...' : <Search size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group span-2"><label>Rua</label><input className="form-input" id="rua" value={formData.rua || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Nº</label><input className="form-input" id="numcasa" value={formData.numcasa || ''} onChange={handleChange} /></div>
                        
                        <div className="form-group"><label>Bairro</label><input className="form-input" id="bairro" value={formData.bairro || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Complemento</label><input className="form-input" id="complemento" value={formData.complemento || ''} onChange={handleChange} /></div>
                        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
                            <div className="form-group"><label>Cidade</label><input className="form-input" id="cidade" value={formData.cidade || ''} onChange={handleChange} /></div>
                            <div className="form-group"><label>UF</label><input className="form-input" id="uf" value={formData.uf || ''} onChange={handleChange} maxLength={2} /></div>
                        </div>
                        <div className="form-group">
                            <label>Codigo IBGE</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              id="codigoibge"
                              value={formData.codigoibge || ''} 
                              onChange={handleChange}
                              disabled={modalMode === 'view'}
                            />
                        </div>
                        
                        <div className="form-group"><label>CX Postal</label><input className="form-input" id="cxpostal" value={formData.cxpostal || ''} onChange={handleChange} /></div>
                        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem' }}>
                            <div className="form-group"><label>Cód. Pais</label><input className="form-input" id="codigopais" value={formData.codigopais || ''} onChange={handleChange} /></div>
                            <div className="form-group"><label>Nome Pais</label><input className="form-input" id="nomepais" value={formData.nomepais || ''} onChange={handleChange} /></div>
                        </div>
                        
                        <div className="form-group"><label>Fone Principal</label><input className="form-input" id="foneprincipal" value={formData.foneprincipal || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Contato Comercial</label><input className="form-input" id="contato_comercial" value={formData.contato_comercial || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Celular Comercial</label><input className="form-input" id="celular_comercial" value={formData.celular_comercial || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Contato Finan.</label><input className="form-input" id="contato_financeiro" value={formData.contato_financeiro || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Celular Finan.</label><input className="form-input" id="celular_financeiro" value={formData.celular_financeiro || ''} onChange={handleChange} /></div>
                        <div className="form-group span-2"><label>Emails (Site/Principal)</label>
                          <div className="multi-field">
                            <input className="form-input" id="email" value={formData.email || ''} onChange={handleChange} placeholder="Email Principal" />
                            <input className="form-input" id="emailnfe" value={formData.emailnfe || ''} onChange={handleChange} placeholder="Email NFe" />
                          </div>
                        </div>
                        <div className="form-group span-2"><label>Site</label><input className="form-input" id="site" value={formData.site || ''} onChange={handleChange} /></div>
                    </div>
                </div>

                <div className="premium-master-panel">
                    <div className="premium-section-title"><Users size={18} /> Parâmetros de Sistema e Flags</div>
  
                  <div className="grid-4" style={{ marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label>Área</label>
                            <select className="form-select" id="id_area" value={formData.id_area || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listAreas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Região</label>
                            <select className="form-select" id="id_regiao" value={formData.id_regiao || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listRegioes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Vendedor</label>
                            <select className="form-select" id="id_vendedor" value={formData.id_vendedor || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listVendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Atividade</label>
                            <select className="form-select" id="id_atividade" value={formData.id_atividade || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listAtividades.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Banco</label>
                            <select className="form-select" id="id_banco" value={formData.id_banco || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listBancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="checkbox-grid">
                        <div className="checkbox-group">
                            <input type="checkbox" id="contribuinte" checked={formData.contribuinte || false} onChange={handleChange} />
                            <label htmlFor="contribuinte">Contribuinte</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="consumidor" checked={formData.consumidor || false} onChange={handleChange} />
                            <label htmlFor="consumidor">Consumidor Final</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="flagcliente" checked={formData.flagcliente || false} onChange={handleChange} />
                            <label htmlFor="flagcliente">É Cliente</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="flagfornecedor" checked={formData.flagfornecedor || false} onChange={handleChange} />
                            <label htmlFor="flagfornecedor">É Fornecedor</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="flagtranspotador" checked={formData.flagtranspotador || false} onChange={handleChange} />
                            <label htmlFor="flagtranspotador">É Transportador</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="flagcolaborador" checked={formData.flagcolaborador || false} onChange={handleChange} />
                            <label htmlFor="flagcolaborador">É Colaborador</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="flagvendedor" checked={formData.flagvendedor || false} onChange={handleChange} />
                            <label htmlFor="flagvendedor">É Vendedor</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="ativo" checked={formData.ativo || false} onChange={handleChange} />
                            <label htmlFor="ativo">Cadastro Ativo</label>
                        </div>
                    </div>
                  </div>
                  </div>
                )}

                {activeTab === 'enderecos' && (
                  <div className="tab-content">
                    <div className="section-header-row standout">
                        <div className="section-title"><Home size={18} /> Gestão de Endereços Adicionais</div>
                        <button type="button" className="btn-primary-small pulse-button" onClick={handleAddEndereco}>
                            <Plus size={14} /> Novo Endereço
                        </button>
                    </div>
                    
                    <div className="address-grid-header">
                        <div className="header-cell">Tipo</div>
                        <div className="header-cell">Endereço</div>
                        <div className="header-cell">Cidade/UF</div>
                        <div className="header-cell">Ações</div>
                    </div>

                    <div className="address-grid-body">
                        {formData.enderecos.length === 0 ? (
                            <div className="empty-grid-message">Nenhum endereço adicional cadastrado. Clique em "Novo Endereço" para começar.</div>
                        ) : (
                            formData.enderecos.map((end, idx) => (
                                <div key={idx} className={`address-grid-row ${editingEnderecoIdx === idx ? 'editing' : ''}`}>
                                    {editingEnderecoIdx === idx ? (
                                        <div className="address-edit-form animate-in">
                                            <div className="nested-header">
                                                <select value={end.tipo} onChange={(e) => handleEnderecoChange(idx, 'tipo', e.target.value)} className="mini-select">
                                                    <option value="Entrega">Entrega</option>
                                                    <option value="Cobrança">Cobrança</option>
                                                    <option value="Comercial">Comercial</option>
                                                    <option value="Outro">Outro</option>
                                                </select>
                                                <button type="button" className="btn-icon-close" onClick={() => setEditingEnderecoIdx(null)}><X size={14} /></button>
                                            </div>
                                            <div className="grid-4">
                                                <div className="form-group">
                                                    <label>CEP</label>
                                                    <div className="input-with-button">
                                                        <input className="form-input" placeholder="CEP" value={end.cep} onChange={(e) => handleEnderecoChange(idx, 'cep', e.target.value)} />
                                                        <button type="button" className="btn-search-premium" onClick={() => handleNestedCEPSearch(idx)} disabled={searchingCEP}>
                                                            {searchingCEP ? '...' : <Search size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="form-group span-2"><label>Rua</label><input className="form-input" value={end.rua} onChange={(e) => handleEnderecoChange(idx, 'rua', e.target.value)} /></div>
                                                <div className="form-group"><label>Nº</label><input className="form-input" value={end.numcasa} onChange={(e) => handleEnderecoChange(idx, 'numcasa', e.target.value)} /></div>
                                                <div className="form-group"><label>Bairro</label><input className="form-input" value={end.bairro} onChange={(e) => handleEnderecoChange(idx, 'bairro', e.target.value)} /></div>
                                                <div className="form-group"><label>Complemento</label><input className="form-input" value={end.complemento} onChange={(e) => handleEnderecoChange(idx, 'complemento', e.target.value)} /></div>
                                                <div className="form-group"><label>Cidade</label><input className="form-input" value={end.cidade} onChange={(e) => handleEnderecoChange(idx, 'cidade', e.target.value)} /></div>
                                                <div className="form-group"><label>UF</label><input className="form-input" value={end.uf} onChange={(e) => handleEnderecoChange(idx, 'uf', e.target.value)} maxLength={2} /></div>
                                            </div>
                                            <div className="form-actions-end">
                                               <button type="button" className="btn-secondary-mini" onClick={() => setEditingEnderecoIdx(null)}>Cancelar</button>
                                               <button type="button" className="btn-primary-mini" onClick={() => setEditingEnderecoIdx(null)}>Gravar Endereço</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="cell cell-type"><span className="badge-tipo">{end.tipo}</span></div>
                                            <div className="cell cell-main">{end.rua}, {end.numcasa} {end.bairro ? `- ${end.bairro}` : ''}</div>
                                            <div className="cell cell-location">{end.cidade || '-'}/{end.uf || '-'}</div>
                                            <div className="cell cell-actions">
                                                <button type="button" className="icon-btn edit-small" title="Alterar" onClick={() => setEditingEnderecoIdx(idx)}><Edit2 size={14} /></button>
                                                <button type="button" className="icon-btn delete-small" title="Remover" onClick={() => handleRemoveEndereco(idx)}><Trash2 size={14} /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="tab-content" style={{ padding: '2rem' }}>
                    <div className="premium-master-panel">
                      <div className="premium-section-title"><Users size={18} /> Social / Cônjuge</div>
                      <div className="grid-4">
                        <div className="form-group"><label>Nascimento</label><input type="date" className="form-input" id="datanascto" value={formData.datanascto || ''} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Sexo</label>
                            <select className="form-select" id="sexo" value={formData.sexo || 'M'} onChange={handleChange}>
                                <option value="M">Masculino</option>
                                <option value="F">Feminino</option>
                                <option value="O">Outro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Estado Civil</label>
                            <select className="form-select" id="ecivil" value={formData.ecivil || 'S'} onChange={handleChange}>
                                <option value="S">Solteiro(a)</option>
                                <option value="C">Casado(a)</option>
                                <option value="D">Divorciado(a)</option>
                                <option value="V">Viúvo(a)</option>
                                <option value="U">União Estável</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid-4">
                        <div className="form-group span-2"><label>Nome do Pai</label><input className="form-input" id="nomepai" value={formData.nomepai || ''} onChange={handleChange} /></div>
                        <div className="form-group span-2"><label>Nome da Mãe</label><input className="form-input" id="nomemae" value={formData.nomemae || ''} onChange={handleChange} /></div>
                        <div className="form-group span-2"><label>Nome Cônjuge</label><input className="form-input" id="nomeconjuge" value={formData.nomeconjuge || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>CPF Cônjuge</label><input className="form-input" id="cpfconjuge" value={formData.cpfconjuge || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>RG Cônjuge</label><input className="form-input" id="rgconjuge" value={formData.rgconjuge || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Nasc. Cônjuge</label><input type="date" className="form-input" id="nasctoconjuge" value={formData.nasctoconjuge || ''} onChange={handleChange} /></div>
                    </div>
                  </div>
                  </div>
                )}

                {activeTab === 'financeiro' && (
                  <div className="tab-content" style={{ padding: '2rem' }}>
                    <div className="premium-master-panel">
                      <div className="premium-section-title"><DollarSign size={18} /> Informações Financeiras</div>
                      <div className="grid-4">
                        <div className="form-group"><label>Limite Crédito</label><input type="number" className="form-input" id="limicredito" value={formData.limicredito || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Prazo Máx.</label><input type="number" className="form-input" id="prazomax" value={formData.prazomax || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Dia Fat.</label><input type="number" className="form-input" id="diafat" value={formData.diafat || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Data Cad.</label><input type="date" className="form-input" id="datacad" value={formData.datacad || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Data SPC</label><input type="date" className="form-input" id="dataspc" value={formData.dataspc || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>1ª Compra</label><input type="date" className="form-input" id="datapricompra" value={formData.datapricompra || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Ult. Compra</label><input type="date" className="form-input" id="dataultcompra" value={formData.dataultcompra || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Qtd. Compras</label><input type="number" className="form-input" id="numcompra" value={formData.numcompra || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Vlr. 1ª Compra</label><input type="number" className="form-input" id="valpricompra" value={formData.valpricompra || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Vlr. Maior Compra</label><input type="number" className="form-input" id="valmaicompra" value={formData.valmaicompra || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Vlr. Ult. Compra</label><input type="number" className="form-input" id="valultcompra" value={formData.valultcompra || 0} onChange={handleChange} /></div>
                        <div className="form-group span-4"><label>Conceito</label><textarea className="form-input" id="conceito" value={formData.conceito || ''} onChange={handleChange} rows={4} /></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'referencias' && (
                  <div className="tab-content" style={{ padding: '2rem' }}>
                    <div className="premium-master-panel">
                      <div className="premium-section-title"><BookOpen size={18} /> Referências</div>
                      <div className="grid-2">
                        <div className="form-group"><label>Ref. SPC</label><textarea className="form-input" id="ref_spc" value={formData.ref_spc || ''} onChange={handleChange} rows={2} /></div>
                        <div className="form-group"><label>Ref. Financeira</label><textarea className="form-input" id="ref_fin" value={formData.ref_fin || ''} onChange={handleChange} rows={2} /></div>
                        <div className="form-group"><label>Ref. Comercial</label><textarea className="form-input" id="ref_com" value={formData.ref_com || ''} onChange={handleChange} rows={2} /></div>
                        <div className="form-group"><label>Ref. Produto</label><textarea className="form-input" id="ref_prod" value={formData.ref_prod || ''} onChange={handleChange} rows={2} /></div>
                        <div className="form-group span-2"><label>Observações Gerais</label><textarea className="form-input" id="obs" value={formData.obs || ''} onChange={handleChange} rows={4} /></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contatos' && (
                  <div className="tab-content" style={{ padding: '2rem' }}>
                    <div className="premium-master-panel">
                      <div className="premium-section-title"><Mail size={18} /> Comunicação Adicional</div>
                      <div className="grid-2">
                        <div className="form-group"><label>Telefone Principal</label><input className="form-input" id="foneprincipal" value={formData.foneprincipal || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>E-mail Principal</label><input className="form-input" id="email" value={formData.email || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>E-mail NFe</label><input className="form-input" id="emailnfe" value={formData.emailnfe || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Site</label><input className="form-input" id="site" value={formData.site || ''} onChange={handleChange} /></div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
              
              <div className="premium-modal-footer no-print">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{modalMode === 'view' ? 'Fechar' : 'Cancelar'}</button>
                {modalMode !== 'view' && <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Cadastro'}</button>}
              </div>
            </form>

            {/* FICHA DO CLIENTE PARA IMPRESSÃO */}
            <div className="print-only">
              <div className="client-report-header">
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>FICHA CADASTRAL DO CLIENTE</h1>
                  <p style={{ margin: 0, opacity: 0.7 }}>Totalcap - Sistema de Gerenciamento</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>ID: <strong>{formData.id || 'NOVO'}</strong></p>
                  <p style={{ margin: 0 }}>Data: <strong>{new Date().toLocaleDateString()}</strong></p>
                </div>
              </div>

              <div className="report-section">
                <div className="report-section-title">IDENTIFICAÇÃO PRINCIPAL</div>
                <div className="report-grid">
                  <div className="report-item" style={{ gridColumn: 'span 2' }}><span className="report-label">Nome / Razão Social</span><span className="report-value">{formData.nome || '---'}</span></div>
                  <div className="report-item" style={{ gridColumn: 'span 1' }}><span className="report-label">Nome Fantasia</span><span className="report-value">{formData.razaosocial || '---'}</span></div>
                  <div className="report-item"><span className="report-label">CPF/CNPJ</span><span className="report-value">{formData.cpfcnpj || '---'}</span></div>
                  <div className="report-item"><span className="report-label">RG/Insc. Estadual</span><span className="report-value">{formData.rgie || '---'}</span></div>
                  <div className="report-item"><span className="report-label">Pessoa</span><span className="report-value">{formData.pessoa === 'F' ? 'Física' : 'Jurídica'}</span></div>
                  <div className="report-item"><span className="report-label">Telefone Principal</span><span className="report-value">{formData.foneprincipal || '---'}</span></div>
                  <div className="report-item" style={{ gridColumn: 'span 2' }}><span className="report-label">E-mail</span><span className="report-value">{formData.email || '---'}</span></div>
                </div>
              </div>

              <div className="report-section">
                <div className="report-section-title">ENDEREÇOS</div>
                <div style={{ marginBottom: '15px' }}>
                  <span className="report-label">Endereço Principal</span>
                  <p style={{ margin: '5px 0', fontSize: '1rem' }}>
                    {formData.rua || '---'}, {formData.numcasa || 'S/N'} {formData.bairro ? `- ${formData.bairro}` : ''}<br />
                    {formData.cidade || '---'} / {formData.uf || '---'} - CEP: {formData.cep || '---'}
                  </p>
                </div>
                {formData.enderecos && formData.enderecos.length > 0 && (
                  <div>
                    <span className="report-label">Endereços Adicionais</span>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                          <th style={{ padding: '5px', borderBottom: '1px solid #ddd' }}>Tipo</th>
                          <th style={{ padding: '5px', borderBottom: '1px solid #ddd' }}>Logradouro</th>
                          <th style={{ padding: '5px', borderBottom: '1px solid #ddd' }}>Cidade/UF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.enderecos.map((end: any, i: number) => (
                          <tr key={i}>
                            <td style={{ padding: '5px', borderBottom: '1px solid #eee' }}>{end.tipo}</td>
                            <td style={{ padding: '5px', borderBottom: '1px solid #eee' }}>{end.rua}, {end.numcasa} {end.bairro}</td>
                            <td style={{ padding: '5px', borderBottom: '1px solid #eee' }}>{end.cidade}/{end.uf}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="report-section">
                <div className="report-section-title">DADOS SOCIAIS / CÔNJUGE</div>
                <div className="report-grid">
                  <div className="report-item"><span className="report-label">Data Nascimento</span><span className="report-value">{formData.datanascto || '---'}</span></div>
                  <div className="report-item"><span className="report-label">Sexo</span><span className="report-value">{formData.sexo || '---'}</span></div>
                  <div className="report-item"><span className="report-label">Estado Civil</span><span className="report-value">{formData.ecivil || '---'}</span></div>
                  <div className="report-item" style={{ gridColumn: 'span 2' }}><span className="report-label">Pai</span><span className="report-value">{formData.nomepai || '---'}</span></div>
                  <div className="report-item" style={{ gridColumn: 'span 1' }}><span className="report-label">Mãe</span><span className="report-value">{formData.nomemae || '---'}</span></div>
                  <div className="report-item" style={{ gridColumn: 'span 2' }}><span className="report-label">Cônjuge</span><span className="report-value">{formData.nomeconjuge || '---'}</span></div>
                  <div className="report-item"><span className="report-label">CPF Cônjuge</span><span className="report-value">{formData.cpfconjuge || '---'}</span></div>
                </div>
              </div>

              <div className="report-section">
                <div className="report-section-title">INFORMAÇÕES FINANCEIRAS</div>
                <div className="report-grid">
                  <div className="report-item"><span className="report-label">Limite de Crédito</span><span className="report-value">R$ {parseFloat(formData.limicredito || 0).toFixed(2)}</span></div>
                  <div className="report-item"><span className="report-label">Prazo Máximo</span><span className="report-value">{formData.prazomax || 0} dias</span></div>
                  <div className="report-item"><span className="report-label">Dia Faturamento</span><span className="report-value">{formData.diafat || 0}</span></div>
                  <div className="report-item"><span className="report-label">Data Cadastro</span><span className="report-value">{formData.datacad || '---'}</span></div>
                  <div className="report-item"><span className="report-label">Qtd. Compras</span><span className="report-value">{formData.numcompra || 0}</span></div>
                  <div className="report-item"><span className="report-label">Maior Compra</span><span className="report-value">R$ {parseFloat(formData.valmaicompra || 0).toFixed(2)}</span></div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <span className="report-label">Conceito Financeiro</span>
                  <p style={{ margin: '5px 0', fontStyle: 'italic' }}>{formData.conceito || 'Sem observações financeiras.'}</p>
                </div>
              </div>

              <div className="report-section">
                <div className="report-section-title">REFERÊNCIAS E OBSERVAÇÕES</div>
                <div className="report-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="report-item"><span className="report-label">Ref. Comercial</span><p style={{ margin: '2px 0' }}>{formData.ref_com || '---'}</p></div>
                  <div className="report-item"><span className="report-label">Ref. Financeira</span><p style={{ margin: '2px 0' }}>{formData.ref_fin || '---'}</p></div>
                  <div className="report-item" style={{ gridColumn: 'span 2' }}><span className="report-label">Observações Gerais</span><p style={{ margin: '2px 0' }}>{formData.obs || '---'}</p></div>
                </div>
              </div>
              
              <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                Impresso em {new Date().toLocaleString()} - Sistema Totalcap
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
