import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, ExternalLink, Printer } from 'lucide-react';
import api from '../lib/api';
import './Transportadora.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Transportadora {
  id: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  endereco: string;
  cep: string;
  cidade: string;
  uf: string;
  fone: string;
  email: string;
  contato: string;
  ativo: boolean;
  datalan?: string;
}

export default function Transportadoras() {
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [filteredTransportadoras, setFilteredTransportadoras] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    endereco: '',
    cep: '',
    cidade: '',
    uf: '',
    fone: '',
    email: '',
    contato: '',
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTransportadoras(transportadoras);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredTransportadoras(transportadoras.filter(t => 
        t.razao_social.toLowerCase().includes(lowerSearch) || 
        t.nome_fantasia?.toLowerCase().includes(lowerSearch) ||
        t.cnpj?.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, transportadoras]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transportadoras/');
      setTransportadoras(response.data);
    } catch (error) {
      console.error("Erro ao buscar transportadoras:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', transportadora?: Transportadora) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && transportadora) {
      setCurrentId(transportadora.id);
      setFormData({
        razao_social: transportadora.razao_social,
        nome_fantasia: transportadora.nome_fantasia || '',
        cnpj: transportadora.cnpj || '',
        endereco: transportadora.endereco || '',
        cep: transportadora.cep || '',
        cidade: transportadora.cidade || '',
        uf: transportadora.uf || '',
        fone: transportadora.fone || '',
        email: transportadora.email || '',
        contato: transportadora.contato || '',
        ativo: transportadora.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        endereco: '',
        cep: '',
        cidade: '',
        uf: '',
        fone: '',
        email: '',
        contato: '',
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
          endereco: data.logradouro + (data.bairro ? ` - ${data.bairro}` : ''),
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
    if (!formData.razao_social.trim()) {
      setFormError('A razão social é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/transportadoras/', formData);
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/transportadoras/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar transportadora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a transportadora "${nome}"?`)) {
      try {
        await api.delete(`/transportadoras/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir transportadora:", error);
        alert('Erro ao excluir a transportadora.');
      }
    }
  };

  return (
    <div className="transportadora-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Transportadoras</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Transportadoras</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Nova Transportadora
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar transportadoras..." 
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
                  <th>Razão Social</th>
                  <th>CNPJ</th>
                  <th>Cidade/UF</th>
                  <th>Contato</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransportadoras.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">Nenhuma transportadora encontrada.</td></tr>
                ) : (
                  filteredTransportadoras.map(t => (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td><strong>{t.razao_social}</strong></td>
                      <td>{t.cnpj || '-'}</td>
                      <td>{t.cidade}/{t.uf}</td>
                      <td>{t.contato || '-'}</td>
                      <td>{t.fone || '-'}</td>
                      <td>
                        <span className={`status-badge ${t.ativo ? 'active' : 'inactive'}`}>
                          {t.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', t)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(t.id, t.razao_social)}><Trash2 size={16} /></button>
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Nova Transportadora' : 'Editar Transportadora'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="razao_social">Razão Social *</label>
                    <input className="form-input" id="razao_social" value={formData.razao_social} onChange={handleChange} required />
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="nome_fantasia">Nome Fantasia</label>
                    <input className="form-input" id="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cnpj">CNPJ</label>
                    <input className="form-input" id="cnpj" value={formData.cnpj} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label htmlFor="cep">CEP</label>
                      <a 
                        href="https://buscacepinter.correios.com.br/app/endereco/index.php" 
                        target="_blank" 
                        rel="noreferrer"
                        className="cep-link"
                        style={{ fontSize: '0.75rem', color: 'var(--primary-color)', textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                        Correios
                      </a>
                    </div>
                    <div className="cep-input-group">
                      <input 
                        className="form-input" 
                        id="cep" 
                        value={formData.cep} 
                        onChange={handleChange} 
                        placeholder="00000-000"
                      />
                      <button 
                        type="button" 
                        className="btn-cep-search" 
                        onClick={handleCepSearch}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '...' : <Search size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="endereco">Endereço</label>
                    <input className="form-input" id="endereco" value={formData.endereco} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cidade">Cidade</label>
                    <input className="form-input" id="cidade" value={formData.cidade} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="uf">UF</label>
                    <input className="form-input" id="uf" value={formData.uf} onChange={handleChange} maxLength={2} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fone">Telefone</label>
                    <input className="form-input" id="fone" value={formData.fone} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input className="form-input" id="email" type="email" value={formData.email} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contato">Contato</label>
                    <input className="form-input" id="contato" value={formData.contato} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <div className="checkbox-group" style={{ marginTop: 0 }}>
                      <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                      <label htmlFor="ativo">Transportadora ativa</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
