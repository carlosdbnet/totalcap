import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, ExternalLink, Printer } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Transportadora.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Transportadora {
  id: number;
  codigo?: string;
  nome: string;
  cpfcnpj: string;
  endereco: string;
  cep: string;
  cidade: string;
  uf: string;
  fone: string;
  fax: string;
  inscricao: string;
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
    codigo: '',
    nome: '',
    cpfcnpj: '',
    endereco: '',
    cep: '',
    cidade: '',
    uf: '',
    fone: '',
    fax: '',
    inscricao: '',
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
        t.nome.toLowerCase().includes(lowerSearch) || 
        t.cpfcnpj?.toLowerCase().includes(lowerSearch) ||
        t.codigo?.toLowerCase().includes(lowerSearch)
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
        codigo: transportadora.codigo || '',
        nome: transportadora.nome,
        cpfcnpj: transportadora.cpfcnpj || '',
        endereco: transportadora.endereco || '',
        cep: transportadora.cep || '',
        cidade: transportadora.cidade || '',
        uf: transportadora.uf || '',
        fone: transportadora.fone || '',
        fax: transportadora.fax || '',
        inscricao: transportadora.inscricao || '',
        ativo: transportadora.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        codigo: '',
        nome: '',
        cpfcnpj: '',
        endereco: '',
        cep: '',
        cidade: '',
        uf: '',
        fone: '',
        fax: '',
        inscricao: '',
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
    if (!formData.nome.trim()) {
      setFormError('O nome/razão social é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = formData;
      if (modalMode === 'create') {
        await api.post('/transportadoras/', payload);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/transportadoras/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar transportadora.'));
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
                  <th>Nome / Razão Social</th>
                  <th>CPF/CNPJ</th>
                  <th>Cidade/UF</th>
                  <th>Inscrição</th>
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
                      <td><strong>{t.nome}</strong></td>
                      <td>{t.cpfcnpj || '-'}</td>
                      <td>{t.cidade}/{t.uf}</td>
                      <td>{t.inscricao || '-'}</td>
                      <td>{t.fone || '-'}</td>
                      <td>
                        <span className={`status-badge ${t.ativo ? 'active' : 'inactive'}`}>
                          {t.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn-icon-premium edit" 
                            onClick={() => openModal('edit', t)}
                            title="Editar"
                            style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon-premium delete" 
                            onClick={() => handleDelete(t.id, t.nome)}
                            title="Excluir"
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
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="premium-modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Nova Transportadora' : 'Editar Transportadora'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="codigo" style={{ fontWeight: '600', color: '#475569' }}>Código</label>
                      <input className="form-input" id="codigo" value={formData.codigo} onChange={handleChange} style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    
                    <div className="form-group full-width">
                      <label htmlFor="nome" style={{ fontWeight: '600', color: '#475569' }}>Nome / Razão Social *</label>
                      <input className="form-input" id="nome" value={formData.nome} onChange={handleChange} required style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cpfcnpj" style={{ fontWeight: '600', color: '#475569' }}>CPF/CNPJ</label>
                      <input className="form-input" id="cpfcnpj" value={formData.cpfcnpj} onChange={handleChange} style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label htmlFor="cep" style={{ fontWeight: '600', color: '#475569' }}>CEP</label>
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
                          style={{ borderRadius: '8px 0 0 8px', border: '1px solid #cbd5e1' }}
                        />
                        <button 
                          type="button" 
                          className="btn-search-premium" 
                          onClick={handleCepSearch}
                          disabled={isSubmitting}
                          style={{ borderRadius: '0 8px 8px 0' }}
                        >
                          {isSubmitting ? '...' : <Search size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="endereco" style={{ fontWeight: '600', color: '#475569' }}>Endereço</label>
                      <input className="form-input" id="endereco" value={formData.endereco} onChange={handleChange} style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cidade" style={{ fontWeight: '600', color: '#475569' }}>Cidade</label>
                      <input className="form-input" id="cidade" value={formData.cidade} onChange={handleChange} style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="uf" style={{ fontWeight: '600', color: '#475569' }}>UF</label>
                      <input className="form-input" id="uf" value={formData.uf} onChange={handleChange} maxLength={2} style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="fone" style={{ fontWeight: '600', color: '#475569' }}>Telefone</label>
                      <input className="form-input" id="fone" value={formData.fone} onChange={handleChange} style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="fax" style={{ fontWeight: '600', color: '#475569' }}>Fax</label>
                      <input className="form-input" id="fax" value={formData.fax} onChange={handleChange} style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="inscricao" style={{ fontWeight: '600', color: '#475569' }}>Inscrição</label>
                      <input className="form-input" id="inscricao" value={formData.inscricao} onChange={handleChange} style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}>Status</label>
                      <div className="checkbox-group" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                        <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569' }}>Transportadora ativa</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="premium-modal-footer">
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
