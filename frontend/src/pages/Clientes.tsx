import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer, User, Home, Mail, DollarSign, Users, CheckCircle } from 'lucide-react';
import api from '../lib/api';
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
  documento: string;
  email: string;
  telefone: string;
  ativo: boolean;
  id_contato?: number;
  contato?: {
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
    id_cidade?: number;
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
}

interface LookupItem {
  id: number;
  nome: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('geral');
  const [searchingCEP, setSearchingCEP] = useState(false);

  // Lookup data
  const [listCidades, setListCidades] = useState<LookupItem[]>([]);
  const [listAreas, setListAreas] = useState<LookupItem[]>([]);
  const [listRegioes, setListRegioes] = useState<LookupItem[]>([]);
  const [listVendedores, setListVendedores] = useState<LookupItem[]>([]);
  const [listAtividades, setListAtividades] = useState<LookupItem[]>([]);
  const [listBancos, setListBancos] = useState<LookupItem[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Default structure for a new contact
  const defaultContato = {
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
    id_cidade: undefined as number | undefined,
    id_area: undefined as number | undefined,
    id_regiao: undefined as number | undefined,
    id_vendedor: undefined as number | undefined,
    id_atividade: undefined as number | undefined,
    id_banco: undefined as number | undefined,
    contribuinte: true,
    consumidor: true,
    flagcliente: true,
    flagfornecedor: false,
    flagtranspotador: false,
    flagcolaborador: false,
    flagvendedor: false,
    ativo: true,
    enderecos: [] as Endereco[],
    emails: [] as ContatoEmail[]
  };

  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    ativo: true,
    contato: defaultContato
  });
  
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
      setListAtividades(ativ.data);
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
        c.documento.includes(lowerSearch)
      ));
    }
  }, [searchTerm, clientes]);

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

  const handleCEPSearch = async () => {
    const cep = formData.contato.cep.replace(/\D/g, '');
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
        setFormData(prev => ({
          ...prev,
          contato: {
            ...prev.contato,
            rua: data.logradouro || prev.contato.rua,
            bairro: data.bairro || prev.contato.bairro,
            cidade: data.localidade || prev.contato.cidade,
            uf: data.uf || prev.contato.uf
          }
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setSearchingCEP(false);
    }
  };

  const handleNestedCEPSearch = async (index: number) => {
    const cep = formData.contato.enderecos[index].cep.replace(/\D/g, '');
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
        const newEnderecos = [...formData.contato.enderecos];
        newEnderecos[index] = {
          ...newEnderecos[index],
          rua: data.logradouro || newEnderecos[index].rua,
          bairro: data.bairro || newEnderecos[index].bairro,
          cidade: data.localidade || newEnderecos[index].cidade,
          uf: data.uf || newEnderecos[index].uf
        };
        setFormData(prev => ({
          ...prev,
          contato: { ...prev.contato, enderecos: newEnderecos }
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP adicional:", error);
    } finally {
      setSearchingCEP(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', cliente?: Cliente) => {
    setModalMode(mode);
    setFormError('');
    setActiveTab('geral');
    if (mode === 'edit' && cliente) {
      setCurrentId(cliente.id);
      setFormData({
        nome: cliente.nome,
        documento: cliente.documento,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        ativo: cliente.ativo,
        contato: {
          ...defaultContato,
          ...(cliente.contato || {}),
          datanascto: cliente.contato?.datanascto ? cliente.contato.datanascto.split('T')[0] : '',
          nasctoconjuge: cliente.contato?.nasctoconjuge ? cliente.contato.nasctoconjuge.split('T')[0] : '',
          datapricompra: cliente.contato?.datapricompra ? cliente.contato.datapricompra.split('T')[0] : '',
          dataultcompra: cliente.contato?.dataultcompra ? cliente.contato.dataultcompra.split('T')[0] : '',
          datacad: cliente.contato?.datacad ? cliente.contato.datacad.split('T')[0] : '',
          dataspc: cliente.contato?.dataspc ? cliente.contato.dataspc.split('T')[0] : '',
        } as any
      });
    } else {
      setCurrentId(null);
      setFormData({
        nome: '',
        documento: '',
        email: '',
        telefone: '',
        ativo: true,
        contato: defaultContato
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (id.startsWith('contato.')) {
      const field = id.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contato: {
          ...prev.contato,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
      
      // Mirror some fields to the main Cliente entity
      if (field === 'nome') setFormData(prev => ({ ...prev, nome: value }));
      if (field === 'cpfcnpj') setFormData(prev => ({ ...prev, documento: value }));
      if (field === 'email') setFormData(prev => ({ ...prev, email: value }));
      if (field === 'foneprincipal') setFormData(prev => ({ ...prev, telefone: value }));

    } else {
      setFormData(prev => ({
        ...prev,
        [id]: type === 'checkbox' ? checked : value
      }));
      
      // If updating top-level 'ativo', mirror to 'contato.ativo'
      if (id === 'ativo') {
        setFormData(prev => ({
          ...prev,
          contato: { ...prev.contato, ativo: checked }
        }));
      }
    }
  };

  const handleAddEndereco = () => {
    setFormData(prev => ({
      ...prev,
      contato: {
        ...prev.contato,
        enderecos: [...prev.contato.enderecos, { tipo: 'Entrega', rua: '', numcasa: '', complemento: '', bairro: '', cep: '', cidade: '', uf: '' }]
      }
    }));
  };

  const handleRemoveEndereco = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contato: {
        ...prev.contato,
        enderecos: prev.contato.enderecos.filter((_, i) => i !== index)
      }
    }));
  };

  const handleEnderecoChange = (index: number, field: string, value: string) => {
    const newEnderecos = [...formData.contato.enderecos];
    (newEnderecos[index] as any)[field] = value;
    setFormData(prev => ({
      ...prev,
      contato: { ...prev.contato, enderecos: newEnderecos }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.documento.trim()) {
      setFormError('Nome e Documento são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/clientes/', formData);
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/clientes/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clientes-container">
      <div className="page-header">
        <h1 className="title">Gestão de Clientes</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => window.print()}><Printer size={20} /> Imprimir</button>
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
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Cidade/UF</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">Nenhum cliente encontrado.</td></tr>
                ) : (
                  filteredClientes.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="servico-info">
                          <span className="servico-desc">{c.nome}</span>
                          <span className="servico-sub">{c.email}</span>
                        </div>
                      </td>
                      <td>{c.documento}</td>
                      <td>{c.contato?.cidade || '-'}/{c.contato?.uf || '-'}</td>
                      <td>{c.telefone || '-'}</td>
                      <td>
                        <span className={`status-badge ${c.ativo ? 'active' : 'inactive'}`}>
                          {c.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', c)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => {/* Delete logic */}}><Trash2 size={16} /></button>
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
          <div className="modal-content extra-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Novo Cadastro de Cliente' : 'Editar Cliente'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="modal-tabs">
              <button className={`tab-btn ${activeTab === 'geral' ? 'active' : ''}`} onClick={() => setActiveTab('geral')}><User size={16} /> Geral</button>
              <button className={`tab-btn ${activeTab === 'enderecos' ? 'active' : ''}`} onClick={() => setActiveTab('enderecos')}><Home size={16} /> Endereços</button>
              <button className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}><Users size={16} /> Social / Cônjuge</button>
              <button className={`tab-btn ${activeTab === 'financeiro' ? 'active' : ''}`} onClick={() => setActiveTab('financeiro')}><DollarSign size={16} /> Financeiro</button>
              <button className={`tab-btn ${activeTab === 'contatos' ? 'active' : ''}`} onClick={() => setActiveTab('contatos')}><Mail size={16} /> Contatos & Flags</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form-scroll">
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                {activeTab === 'geral' && (
                  <div className="tab-content">
                    {/* SEÇÃO 1: IDENTIFICAÇÃO */}
                    <div className="section-title"><User size={18} /> Identificação Principal</div>
                    <div className="grid-4">
                        <div className="form-group span-2">
                            <label>Nome / Razão Social *</label>
                            <input className="form-input" id="contato.nome" value={formData.contato.nome} onChange={handleChange} placeholder="Nome completo ou Razão Social" required />
                        </div>
                        <div className="form-group span-2">
                            <label>Nome Fantasia</label>
                            <input className="form-input" id="contato.razaosocial" value={formData.contato.razaosocial} onChange={handleChange} placeholder="Apelido ou Fantasia" />
                        </div>
                        <div className="form-group">
                            <label>Pessoa</label>
                            <select className="form-select" id="contato.pessoa" value={formData.contato.pessoa} onChange={handleChange}>
                                <option value="F">Física</option>
                                <option value="J">Jurídica</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tipo Doc.</label>
                            <input className="form-input" id="contato.tipodoc" value={formData.contato.tipodoc} onChange={handleChange} placeholder="Ex: CPF, CNPJ" />
                        </div>
                        <div className="form-group">
                            <label>CPF / CNPJ *</label>
                            <input className="form-input" id="contato.cpfcnpj" value={formData.contato.cpfcnpj} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>RG / Documento</label>
                            <input className="form-input" id="contato.rg" value={formData.contato.rg} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Órgão Emissor</label>
                            <input className="form-input" id="contato.emitenterg" value={formData.contato.emitenterg} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Inscrição Estadual</label>
                            <input className="form-input" id="contato.inscestadual" value={formData.contato.inscestadual} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Inscrição Municipal</label>
                            <input className="form-input" id="contato.inscmunicipio" value={formData.contato.inscmunicipio} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="section-divider"></div>
                    
                    {/* SEÇÃO 2: LOCALIZAÇÃO E COMUNICAÇÃO */}
                    <div className="section-title"><Home size={18} /> Localização e Contato</div>
                    <div className="grid-4">
                        <div className="form-group span-2"><label>Rua</label><input className="form-input" id="contato.rua" value={formData.contato.rua} onChange={handleChange} /></div>
                        <div className="form-group"><label>Nº</label><input className="form-input" id="contato.numcasa" value={formData.contato.numcasa} onChange={handleChange} /></div>
                        <div className="form-group"><label>Complemento</label><input className="form-input" id="contato.complemento" value={formData.contato.complemento} onChange={handleChange} /></div>
                        <div className="form-group"><label>Bairro</label><input className="form-input" id="contato.bairro" value={formData.contato.bairro} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>CEP</label>
                            <div className="input-with-button">
                                <input className="form-input" id="contato.cep" value={formData.contato.cep} onChange={handleChange} placeholder="00000-000" />
                                <button type="button" className="btn-mini-search" onClick={handleCEPSearch} disabled={searchingCEP}>
                                    {searchingCEP ? '...' : <Search size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group"><label>CX Postal</label><input className="form-input" id="contato.cxpostal" value={formData.contato.cxpostal} onChange={handleChange} /></div>
                        <div className="form-group"><label>Cidade</label><input className="form-input" id="contato.cidade" value={formData.contato.cidade} onChange={handleChange} /></div>
                        <div className="form-group"><label>UF</label><input className="form-input" id="contato.uf" value={formData.contato.uf} onChange={handleChange} maxLength={2} /></div>
                        <div className="form-group"><label>Cód. Pais</label><input className="form-input" id="contato.codigopais" value={formData.contato.codigopais} onChange={handleChange} /></div>
                        <div className="form-group"><label>Nome Pais</label><input className="form-input" id="contato.nomepais" value={formData.contato.nomepais} onChange={handleChange} /></div>
                        <div className="form-group"><label>Fone Principal</label><input className="form-input" id="contato.foneprincipal" value={formData.contato.foneprincipal} onChange={handleChange} /></div>
                        <div className="form-group"><label>Contato Comercial</label><input className="form-input" id="contato.contato_comercial" value={formData.contato.contato_comercial} onChange={handleChange} /></div>
                        <div className="form-group"><label>Celular Comercial</label><input className="form-input" id="contato.celular_comercial" value={formData.contato.celular_comercial} onChange={handleChange} /></div>
                        <div className="form-group"><label>Contato Finan.</label><input className="form-input" id="contato.contato_financeiro" value={formData.contato.contato_financeiro} onChange={handleChange} /></div>
                        <div className="form-group"><label>Celular Finan.</label><input className="form-input" id="contato.celular_financeiro" value={formData.contato.celular_financeiro} onChange={handleChange} /></div>
                        <div className="form-group span-2"><label>Emails (Site/Principal)</label>
                          <div className="multi-field">
                            <input className="form-input" id="contato.email" value={formData.contato.email} onChange={handleChange} placeholder="Email Principal" />
                            <input className="form-input" id="contato.emailnfe" value={formData.contato.emailnfe} onChange={handleChange} placeholder="Email NFe" />
                          </div>
                        </div>
                        <div className="form-group span-2"><label>Site</label><input className="form-input" id="contato.site" value={formData.contato.site} onChange={handleChange} /></div>
                    </div>

                    <div className="section-divider"></div>

                    {/* SEÇÃO 3: SOCIAL E CÔNJUGE */}
                    <div className="section-title"><Users size={18} /> Social e Cônjuge</div>
                    <div className="grid-4">
                        <div className="form-group"><label>Nascimento</label><input type="date" className="form-input" id="contato.datanascto" value={formData.contato.datanascto} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Sexo</label>
                            <select className="form-select" id="contato.sexo" value={formData.contato.sexo} onChange={handleChange}>
                                <option value="M">Masculino</option>
                                <option value="F">Feminino</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Estado Civil</label>
                            <select className="form-select" id="contato.ecivil" value={formData.contato.ecivil} onChange={handleChange}>
                                <option value="S">Solteiro(a)</option>
                                <option value="C">Casado(a)</option>
                                <option value="D">Divorciado(a)</option>
                                <option value="V">Viúvo(a)</option>
                            </select>
                        </div>
                        <div className="form-group span-2"><label>Nome do Pai</label><input className="form-input" id="contato.nomepai" value={formData.contato.nomepai} onChange={handleChange} /></div>
                        <div className="form-group span-2"><label>Nome da Mãe</label><input className="form-input" id="contato.nomemae" value={formData.contato.nomemae} onChange={handleChange} /></div>
                        <div className="form-group span-2"><label>Nome do Cônjuge</label><input className="form-input" id="contato.nomeconjuge" value={formData.contato.nomeconjuge} onChange={handleChange} /></div>
                        <div className="form-group"><label>RG Cônjuge</label><input className="form-input" id="contato.rgconjuge" value={formData.contato.rgconjuge} onChange={handleChange} /></div>
                        <div className="form-group"><label>Nasc. Cônjuge</label><input type="date" className="form-input" id="contato.nasctoconjuge" value={formData.contato.nasctoconjuge} onChange={handleChange} /></div>
                    </div>

                    <div className="section-divider"></div>

                    {/* SEÇÃO 4: FINANCEIRO E HISTÓRICO */}
                    <div className="section-title"><DollarSign size={18} /> Financeiro e Histórico</div>
                    <div className="grid-4">
                        <div className="form-group"><label>Limite Crédito</label><input type="number" className="form-input" id="contato.limicredito" value={formData.contato.limicredito} onChange={handleChange} /></div>
                        <div className="form-group"><label>Prazo Máx.</label><input type="number" className="form-input" id="contato.prazomax" value={formData.contato.prazomax} onChange={handleChange} /></div>
                        <div className="form-group"><label>Dia Fat.</label><input type="number" className="form-input" id="contato.diafat" value={formData.contato.diafat} onChange={handleChange} /></div>
                        <div className="form-group"><label>Data Cad.</label><input type="date" className="form-input" id="contato.datacad" value={formData.contato.datacad} onChange={handleChange} /></div>
                        <div className="form-group"><label>Data SPC</label><input type="date" className="form-input" id="contato.dataspc" value={formData.contato.dataspc} onChange={handleChange} /></div>
                        <div className="form-group"><label>1ª Compra</label><input type="date" className="form-input" id="contato.datapricompra" value={formData.contato.datapricompra} onChange={handleChange} /></div>
                        <div className="form-group"><label>Ult. Compra</label><input type="date" className="form-input" id="contato.dataultcompra" value={formData.contato.dataultcompra} onChange={handleChange} /></div>
                        <div className="form-group"><label>Qtd. Compras</label><input type="number" className="form-input" id="contato.numcompra" value={formData.contato.numcompra} onChange={handleChange} /></div>
                        <div className="form-group"><label>Vlr. 1ª Compra</label><input type="number" className="form-input" id="contato.valpricompra" value={formData.contato.valpricompra} onChange={handleChange} /></div>
                        <div className="form-group"><label>Vlr. Maior Compra</label><input type="number" className="form-input" id="contato.valmaicompra" value={formData.contato.valmaicompra} onChange={handleChange} /></div>
                        <div className="form-group"><label>Vlr. Ult. Compra</label><input type="number" className="form-input" id="contato.valultcompra" value={formData.contato.valultcompra} onChange={handleChange} /></div>
                        <div className="form-group span-4"><label>Conceito</label><textarea className="form-input" id="contato.conceito" value={formData.contato.conceito} onChange={handleChange} rows={2} /></div>
                    </div>

                    <div className="section-divider"></div>

                    {/* SEÇÃO 5: REFERÊNCIAS E OBS */}
                    <div className="section-title"><CheckCircle size={18} /> Referências e Observações</div>
                    <div className="grid-2">
                        <div className="form-group"><label>Ref. SPC</label><textarea className="form-input" id="contato.ref_spc" value={formData.contato.ref_spc} onChange={handleChange} rows={2} /></div>
                        <div className="form-group"><label>Ref. Financeira</label><textarea className="form-input" id="contato.ref_fin" value={formData.contato.ref_fin} onChange={handleChange} rows={2} /></div>
                        <div className="form-group"><label>Ref. Comercial</label><textarea className="form-input" id="contato.ref_com" value={formData.contato.ref_com} onChange={handleChange} rows={2} /></div>
                        <div className="form-group"><label>Ref. Produto</label><textarea className="form-input" id="contato.ref_prod" value={formData.contato.ref_prod} onChange={handleChange} rows={2} /></div>
                        <div className="form-group span-2"><label>Observações Gerais</label><textarea className="form-input" id="contato.obs" value={formData.contato.obs} onChange={handleChange} rows={4} /></div>
                    </div>

                    <div className="section-divider"></div>

                    {/* SEÇÃO 6: PARÂMETROS E FLAGS */}
                    <div className="section-title"><Users size={18} /> Parâmetros de Sistema e Flags</div>
                    <div className="grid-4" style={{ marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label>Cidade (Associação)</label>
                            <select className="form-select" id="contato.id_cidade" value={formData.contato.id_cidade || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listCidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Área</label>
                            <select className="form-select" id="contato.id_area" value={formData.contato.id_area || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listAreas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Região</label>
                            <select className="form-select" id="contato.id_regiao" value={formData.contato.id_regiao || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listRegioes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Vendedor</label>
                            <select className="form-select" id="contato.id_vendedor" value={formData.contato.id_vendedor || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listVendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Atividade</label>
                            <select className="form-select" id="contato.id_atividade" value={formData.contato.id_atividade || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listAtividades.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Banco</label>
                            <select className="form-select" id="contato.id_banco" value={formData.contato.id_banco || ''} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                {listBancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="checkbox-grid">
                        <div className="checkbox-group">
                            <input type="checkbox" id="contato.contribuinte" checked={formData.contato.contribuinte} onChange={handleChange} />
                            <label htmlFor="contato.contribuinte">Contribuinte</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="contato.consumidor" checked={formData.contato.consumidor} onChange={handleChange} />
                            <label htmlFor="contato.consumidor">Consumidor Final</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="contato.flagcliente" checked={formData.contato.flagcliente} onChange={handleChange} />
                            <label htmlFor="contato.flagcliente">É Cliente</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="contato.flagfornecedor" checked={formData.contato.flagfornecedor} onChange={handleChange} />
                            <label htmlFor="contato.flagfornecedor">É Fornecedor</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="contato.flagtranspotador" checked={formData.contato.flagtranspotador} onChange={handleChange} />
                            <label htmlFor="contato.flagtranspotador">É Transportador</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="contato.flagcolaborador" checked={formData.contato.flagcolaborador} onChange={handleChange} />
                            <label htmlFor="contato.flagcolaborador">É Colaborador</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="contato.flagvendedor" checked={formData.contato.flagvendedor} onChange={handleChange} />
                            <label htmlFor="contato.flagvendedor">É Vendedor</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="contato.ativo" checked={formData.contato.ativo} onChange={handleChange} />
                            <label htmlFor="contato.ativo">Cadastro Ativo</label>
                        </div>
                    </div>
                  </div>
                )}

                {activeTab === 'enderecos' && (
                  <div className="tab-content">
                    <div className="section-title">Endereço Principal</div>
                    <div className="grid-3">
                        <div className="form-group span-2"><label>Rua</label><input className="form-input" id="contato.rua" value={formData.contato.rua} onChange={handleChange} /></div>
                        <div className="form-group"><label>Nº</label><input className="form-input" id="contato.numcasa" value={formData.contato.numcasa} onChange={handleChange} /></div>
                        <div className="form-group"><label>Bairro</label><input className="form-input" id="contato.bairro" value={formData.contato.bairro} onChange={handleChange} /></div>
                        <div className="form-group"><label>CEP</label><input className="form-input" id="contato.cep" value={formData.contato.cep} onChange={handleChange} /></div>
                        <div className="form-group"><label>Cidade</label><input className="form-input" id="contato.cidade" value={formData.contato.cidade} onChange={handleChange} /></div>
                        <div className="form-group"><label>UF</label><input className="form-input" id="contato.uf" value={formData.contato.uf} onChange={handleChange} maxLength={2} /></div>
                    </div>
                    
                    <div className="section-divider"></div>
                    <div className="section-header-row">
                        <div className="section-title">Endereços Adicionais (Entrega / Cobrança)</div>
                        <button type="button" className="btn-icon-text" onClick={handleAddEndereco}><Plus size={16} /> Adicionar</button>
                    </div>
                    
                    {formData.contato.enderecos.map((end, idx) => (
                      <div key={idx} className="nested-item glass-nested">
                        <div className="nested-header">
                            <select value={end.tipo} onChange={(e) => handleEnderecoChange(idx, 'tipo', e.target.value)} className="mini-select">
                                <option value="Entrega">Entrega</option>
                                <option value="Cobrança">Cobrança</option>
                            </select>
                            <button type="button" className="btn-remove" onClick={() => handleRemoveEndereco(idx)}><Trash2 size={14} /></button>
                        </div>
                        <div className="grid-3">
                            <input className="form-input" placeholder="Rua" value={end.rua} onChange={(e) => handleEnderecoChange(idx, 'rua', e.target.value)} />
                            <input className="form-input" placeholder="Nº" value={end.numcasa} onChange={(e) => handleEnderecoChange(idx, 'numcasa', e.target.value)} />
                            <input className="form-input" placeholder="Bairro" value={end.bairro} onChange={(e) => handleEnderecoChange(idx, 'bairro', e.target.value)} />
                            <div className="input-with-button">
                                <input className="form-input" placeholder="CEP" value={end.cep} onChange={(e) => handleEnderecoChange(idx, 'cep', e.target.value)} />
                                <button type="button" className="btn-mini-search" onClick={() => handleNestedCEPSearch(idx)} disabled={searchingCEP}>
                                    {searchingCEP ? '...' : <Search size={16} />}
                                </button>
                            </div>
                            <input className="form-input" placeholder="Cidade" value={end.cidade} onChange={(e) => handleEnderecoChange(idx, 'cidade', e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="tab-content grid-2">
                    <div className="form-group"><label>Nome do Pai</label><input className="form-input" id="contato.nomepai" value={formData.contato.nomepai} onChange={handleChange} /></div>
                    <div className="form-group"><label>Nome da Mãe</label><input className="form-input" id="contato.nomemae" value={formData.contato.nomemae} onChange={handleChange} /></div>
                    <div className="form-group"><label>Nome do Cônjuge</label><input className="form-input" id="contato.nomeconjuge" value={formData.contato.nomeconjuge} onChange={handleChange} /></div>
                    <div className="form-group"><label>RG do Cônjuge</label><input className="form-input" id="contato.rgconjuge" value={formData.contato.rgconjuge} onChange={handleChange} /></div>
                    <div className="form-group"><label>Nascimento Cônjuge</label><input type="date" className="form-input" id="contato.nasctoconjuge" value={formData.contato.nasctoconjuge} onChange={handleChange} /></div>
                  </div>
                )}

                {activeTab === 'financeiro' && (
                  <div className="tab-content grid-3">
                    <div className="form-group"><label>Limite de Crédito</label><input type="number" className="form-input" id="contato.limicredito" value={formData.contato.limicredito} onChange={handleChange} /></div>
                    <div className="form-group"><label>Prazo Máximo (dias)</label><input type="number" className="form-input" id="contato.prazomax" value={formData.contato.prazomax} onChange={handleChange} /></div>
                    <div className="form-group"><label>Dia de Fat.</label><input type="number" className="form-input" id="contato.diafat" value={formData.contato.diafat} onChange={handleChange} /></div>
                    <div className="form-group span-3"><label>Conceito / Observação Financeira</label><textarea className="form-input" id="contato.conceito" value={formData.contato.conceito} onChange={handleChange} rows={3} /></div>
                  </div>
                )}

                {activeTab === 'contatos' && (
                  <div className="tab-content">
                    <div className="grid-2">
                        <div className="form-group"><label>Telefone Principal</label><input className="form-input" id="contato.foneprincipal" value={formData.contato.foneprincipal} onChange={handleChange} /></div>
                        <div className="form-group"><label>E-mail Principal</label><input className="form-input" id="contato.email" value={formData.contato.email} onChange={handleChange} /></div>
                        <div className="form-group"><label>E-mail NFe</label><input className="form-input" id="contato.emailnfe" value={formData.contato.emailnfe} onChange={handleChange} /></div>
                        <div className="form-group"><label>Site</label><input className="form-input" id="contato.site" value={formData.contato.site} onChange={handleChange} /></div>
                    </div>

                  </div>
                )}

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Cadastro'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
