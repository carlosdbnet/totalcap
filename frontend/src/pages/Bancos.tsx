import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer, Landmark, Building2, MapPin, Phone, CreditCard, User, Hash } from 'lucide-react';
import api from '../lib/api';
import './Bancos.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Banco {
  id: number;
  codigo?: string;
  nome: string;
  razaosocial?: string;
  endereco?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  contato?: string;
  fone?: string;
  cnpj?: string;
  ativo: boolean;
  datalan?: string;
}

export default function Bancos() {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [filteredBancos, setFilteredBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    razaosocial: '',
    endereco: '',
    cep: '',
    cidade: '',
    uf: '',
    contato: '',
    fone: '',
    cnpj: '',
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBancos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBancos(bancos);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredBancos(bancos.filter(b => 
        b.nome.toLowerCase().includes(lowerSearch) || 
        (b.codigo && b.codigo.toLowerCase().includes(lowerSearch)) ||
        (b.cnpj && b.cnpj.toLowerCase().includes(lowerSearch))
      ));
    }
  }, [searchTerm, bancos]);

  const fetchBancos = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await api.get('/bancos/');
      setBancos(response.data);
    } catch (error: any) {
      console.error("Erro ao buscar bancos:", error);
      setFetchError(error.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', banco?: Banco) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && banco) {
      setCurrentId(banco.id);
      setFormData({
        codigo: banco.codigo || '',
        nome: banco.nome,
        razaosocial: banco.razaosocial || '',
        endereco: banco.endereco || '',
        cep: banco.cep || '',
        cidade: banco.cidade || '',
        uf: banco.uf || '',
        contato: banco.contato || '',
        fone: banco.fone || '',
        cnpj: banco.cnpj || '',
        ativo: banco.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        codigo: '',
        nome: '',
        razaosocial: '',
        endereco: '',
        cep: '',
        cidade: '',
        uf: '',
        contato: '',
        fone: '',
        cnpj: '',
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setFormError('O Nome do Banco é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/bancos/', formData);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/bancos/${currentId}`, formData);
      }
      await fetchBancos();
      closeModal();
    } catch (err: any) {
      console.error("Erro ao salvar banco:", err);
      const detail = err.response?.data?.detail;
      const errorMessage = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : 'Ocorreu um erro ao salvar o banco.');
      
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, nomeBanco: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o banco "${nomeBanco}"? Esta ação não pode ser desfeita.`)) {
      try {
        await api.delete(`/bancos/${id}`);
        await fetchBancos();
      } catch (error) {
        console.error("Erro ao excluir banco:", error);
        alert('Erro ao excluir o banco. Ele pode estar sendo utilizado em algum faturamento.');
      }
    }
  };

  return (
    <div className="bancos-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Bancos</h1>
      </div>

      <div className="page-header">
        <div className="title-group">
          <Landmark size={28} className="title-icon" />
          <h1 className="title">Cadastro de Bancos</h1>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Banco
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nome, código ou CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {fetchError && (
          <div className="error-banner" style={{ margin: '0 1.5rem 1rem 1.5rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={20} />
            <span>Erro ao carregar bancos: {fetchError}. Verifique a conexão com o servidor.</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Carregando dados...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Cód.</th>
                  <th>Nome do Banco</th>
                  <th>CNPJ</th>
                  <th>Cidade/UF</th>
                  <th>Status</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredBancos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      {searchTerm ? "Nenhum banco encontrado." : "Nenhum banco cadastrado."}
                    </td>
                  </tr>
                ) : (
                  filteredBancos.map((banco) => (
                    <tr key={banco.id}>
                      <td><strong>{banco.codigo || '-'}</strong></td>
                      <td>
                        <div className="bank-info">
                          <span className="bank-name">{banco.nome}</span>
                          <span className="bank-razao">{banco.razaosocial}</span>
                        </div>
                      </td>
                      <td>{banco.cnpj || '-'}</td>
                      <td>{banco.cidade}{banco.uf ? `/${banco.uf}` : ''}</td>
                      <td>
                        <span className={`status-badge ${banco.ativo ? 'active' : 'inactive'}`}>
                          {banco.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn-icon-premium edit" 
                            onClick={() => openModal('edit', banco)}
                            title="Editar"
                            style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon-premium delete" 
                            onClick={() => handleDelete(banco.id, banco.nome)}
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
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="premium-modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="modal-title-group">
                <Landmark size={24} className="modal-title-icon" />
                <h2>{modalMode === 'create' ? 'Novo Banco' : 'Editar Banco'}</h2>
              </div>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body custom-scrollbar" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="form-grid">
                    <div className="form-group col-2">
                      <label style={{ fontWeight: '600', color: '#475569' }}><Building2 size={14} /> Nome do Banco *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        placeholder="Ex: Banco do Brasil"
                        maxLength={20}
                        required
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}><Hash size={14} /> Código</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                        placeholder="Ex: 001"
                        maxLength={4}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group col-3">
                      <label style={{ fontWeight: '600', color: '#475569' }}><Building2 size={14} /> Razão Social</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.razaosocial}
                        onChange={(e) => setFormData({...formData, razaosocial: e.target.value})}
                        placeholder="Nome oficial da instituição"
                        maxLength={50}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group col-2">
                      <label style={{ fontWeight: '600', color: '#475569' }}><CreditCard size={14} /> CNPJ</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group col-3">
                      <label style={{ fontWeight: '600', color: '#475569' }}><MapPin size={14} /> Endereço</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.endereco}
                        onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                        placeholder="Rua, número, bairro..."
                        maxLength={100}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}>CEP</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.cep}
                        onChange={(e) => setFormData({...formData, cep: e.target.value})}
                        placeholder="00000-000"
                        maxLength={9}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group col-2">
                      <label style={{ fontWeight: '600', color: '#475569' }}>Cidade</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.cidade}
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                        placeholder="Nome da cidade"
                        maxLength={60}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}>UF</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.uf}
                        onChange={(e) => setFormData({...formData, uf: e.target.value})}
                        placeholder="Estado (ex: SP)"
                        maxLength={2}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group col-2">
                      <label style={{ fontWeight: '600', color: '#475569' }}><User size={14} /> Contato</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.contato}
                        onChange={(e) => setFormData({...formData, contato: e.target.value})}
                        placeholder="Nome do gerente ou contato"
                        maxLength={20}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}><Phone size={14} /> Telefone</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.fone}
                        onChange={(e) => setFormData({...formData, fone: e.target.value})}
                        placeholder="(00) 0000-0000"
                        maxLength={17}
                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                  
                  <div className="checkbox-group" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Banco ativo para faturamento</label>
                  </div>
                </div>
              </div>
              
              <div className="premium-modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Banco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
