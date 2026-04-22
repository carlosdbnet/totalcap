import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, ExternalLink, Printer, Building2, Mail, Phone, Globe, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import './Empresas.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Empresa {
  id: number;
  nome: string;
  razaosocial: string;
  endereco: string;
  numcasa: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  telefone: string;
  cxpostal: string;
  email: string;
  cnpj: string;
  inscestadual: string;
  inscmunicipio: string;
  token: string;
  ativo: boolean;
}

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    razaosocial: '',
    cnpj: '',
    inscestadual: '',
    inscmunicipio: '',
    endereco: '',
    numcasa: '',
    bairro: '',
    cep: '',
    cidade: '',
    uf: '',
    telefone: '',
    cxpostal: '',
    email: '',
    token: '',
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmpresas(empresas);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredEmpresas(empresas.filter(e => 
        e.nome.toLowerCase().includes(lowerSearch) || 
        e.razaosocial?.toLowerCase().includes(lowerSearch) ||
        e.cnpj?.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, empresas]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/empresas/');
      setEmpresas(response.data);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', empresa?: Empresa) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && empresa) {
      setCurrentId(empresa.id);
      setFormData({
        nome: empresa.nome,
        razaosocial: empresa.razaosocial || '',
        cnpj: empresa.cnpj || '',
        inscestadual: empresa.inscestadual || '',
        inscmunicipio: empresa.inscmunicipio || '',
        endereco: empresa.endereco || '',
        numcasa: empresa.numcasa || '',
        bairro: empresa.bairro || '',
        cep: empresa.cep || '',
        cidade: empresa.cidade || '',
        uf: empresa.uf || '',
        telefone: empresa.telefone || '',
        cxpostal: empresa.cxpostal || '',
        email: empresa.email || '',
        token: empresa.token || '',
        ativo: empresa.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        nome: '',
        razaosocial: '',
        cnpj: '',
        inscestadual: '',
        inscmunicipio: '',
        endereco: '',
        numcasa: '',
        bairro: '',
        cep: '',
        cidade: '',
        uf: '',
        telefone: '',
        cxpostal: '',
        email: '',
        token: '',
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCepSearch = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      alert('Por favor, informe um CEP válido com 8 dígitos.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado.');
      } else {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert('Erro ao consultar o serviço de CEP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setFormError('O nome é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/empresas/', formData);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/empresas/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar empresa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${nome}"?`)) {
      try {
        await api.delete(`/empresas/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir empresa:", error);
        alert('Erro ao excluir a empresa.');
      }
    }
  };

  return (
    <div className="empresas-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Dados da Empresa</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Empresa</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => window.print()}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Cadastrar Empresa
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar empresas..." 
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
                  <th>ID</th>
                  <th>Nome / Razão Social</th>
                  <th>CNPJ</th>
                  <th>Cidade/UF</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmpresas.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">Nenhuma empresa encontrada.</td></tr>
                ) : (
                  filteredEmpresas.map(emp => (
                    <tr key={emp.id}>
                      <td>#{emp.id}</td>
                      <td>
                        <div className="company-cell">
                          <strong>{emp.nome}</strong>
                          <span className="sub-text">{emp.razaosocial}</span>
                        </div>
                      </td>
                      <td>{emp.cnpj || '-'}</td>
                      <td>{emp.cidade}/{emp.uf}</td>
                      <td>{emp.telefone || '-'}</td>
                      <td>
                        <span className={`status-badge ${emp.ativo ? 'active' : 'inactive'}`}>
                          {emp.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', emp)} title="Editar"><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(emp.id, emp.nome)} title="Excluir"><Trash2 size={16} /></button>
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
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Configurar Nova Empresa' : 'Editar Dados da Empresa'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-grid">
                  <div className="section-header full-width">
                    <Building2 size={18} />
                    <h3>Identificação</h3>
                  </div>
                  
                  <div className="form-group span-2">
                    <label htmlFor="nome">Nome Fantasia *</label>
                    <input className="form-input" id="nome" value={formData.nome} onChange={handleChange} required />
                  </div>
                  
                  <div className="form-group span-2">
                    <label htmlFor="razaosocial">Razão Social</label>
                    <input className="form-input" id="razaosocial" value={formData.razaosocial} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cnpj">CNPJ</label>
                    <input className="form-input" id="cnpj" value={formData.cnpj} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="inscestadual">Insc. Estadual</label>
                    <input className="form-input" id="inscestadual" value={formData.inscestadual} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="inscmunicipio">Insc. Municipal</label>
                    <input className="form-input" id="inscmunicipio" value={formData.inscmunicipio} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="token">Token API/Nota</label>
                    <div className="input-with-icon">
                      <input className="form-input" id="token" value={formData.token} onChange={handleChange} />
                      <ShieldCheck size={16} className="input-icon-right" />
                    </div>
                  </div>

                  <div className="section-header full-width">
                    <Globe size={18} />
                    <h3>Localização</h3>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label htmlFor="cep">CEP</label>
                      <a 
                        href="https://buscacepinter.correios.com.br/app/endereco/index.php" 
                        target="_blank" 
                        rel="noreferrer"
                        className="cep-link"
                        style={{ fontSize: '0.75rem', color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ExternalLink size={12} />
                        Correios
                      </a>
                    </div>
                    <div className="input-with-button">
                      <input 
                        className="form-input" 
                        id="cep" 
                        value={formData.cep} 
                        onChange={handleChange} 
                        placeholder="00000-000"
                      />
                      <button 
                        type="button" 
                        className="btn-search-premium" 
                        onClick={handleCepSearch}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '...' : <Search size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group span-2">
                    <label htmlFor="endereco">Endereço (Rua/Av)</label>
                    <input className="form-input" id="endereco" value={formData.endereco} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="numcasa">Número</label>
                    <input className="form-input" id="numcasa" value={formData.numcasa} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bairro">Bairro</label>
                    <input className="form-input" id="bairro" value={formData.bairro} onChange={handleChange} />
                  </div>
                  <div className="form-group span-2">
                    <label htmlFor="cidade">Cidade</label>
                    <input className="form-input" id="cidade" value={formData.cidade} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="uf">UF</label>
                    <input className="form-input" id="uf" value={formData.uf} onChange={handleChange} maxLength={2} />
                  </div>

                  <div className="section-header full-width">
                    <Phone size={18} />
                    <h3>Contato e Adicionais</h3>
                  </div>

                  <div className="form-group">
                    <label htmlFor="telefone">Telefone</label>
                    <input className="form-input" id="telefone" value={formData.telefone} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cxpostal">Caixa Postal</label>
                    <input className="form-input" id="cxpostal" value={formData.cxpostal} onChange={handleChange} />
                  </div>
                  <div className="form-group span-2">
                    <label htmlFor="email">Email Corporativo</label>
                    <div className="input-with-icon">
                      <input className="form-input" id="email" type="email" value={formData.email} onChange={handleChange} />
                      <Mail size={16} className="input-icon-right" />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <div className="checkbox-group premium-switch">
                      <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                      <label htmlFor="ativo">Empresa Ativa no Sistema</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {modalMode === 'create' ? 'Concluir Cadastro' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
