import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Estados.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Estado {
  id: number;
  uf: string;
  nome: string;
  ativo: boolean;
}

export default function Estados() {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [filteredEstados, setFilteredEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    uf: '',
    nome: '',
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEstados(estados);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredEstados(estados.filter(e => 
        e.nome.toLowerCase().includes(lowerSearch) || 
        e.uf.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, estados]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/estados/');
      setEstados(response.data);
    } catch (error) {
      console.error("Erro ao buscar estados:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', estado?: Estado) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && estado) {
      setCurrentId(estado.id);
      setFormData({
        uf: estado.uf,
        nome: estado.nome,
        ativo: estado.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        uf: '',
        nome: '',
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uf.trim() || !formData.nome.trim()) {
      setFormError('UF e Nome são obrigatórios.');
      return;
    }

    if (formData.uf.length !== 2) {
      setFormError('A UF deve ter exatamente 2 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/estados/', formData);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/estados/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar estado.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o estado "${nome}"?`)) {
      try {
        await api.delete(`/estados/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir estado:", error);
        alert('Erro ao excluir o estado. Verifique se existem cidades vinculadas.');
      }
    }
  };

  return (
    <div className="estados-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Estados (UF)</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Estados</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Estado
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar estados..." 
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
                  <th style={{ width: '80px' }}>ID</th>
                  <th style={{ width: '100px' }}>UF</th>
                  <th>Nome do Estado</th>
                  <th>Status</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstados.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Nenhum estado encontrado.</td></tr>
                ) : (
                  filteredEstados.map(e => (
                    <tr key={e.id}>
                      <td>#{e.id}</td>
                      <td><strong>{e.uf}</strong></td>
                      <td>{e.nome}</td>
                      <td>
                        <span className={`status-badge ${e.ativo ? 'active' : 'inactive'}`}>
                          {e.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', e)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(e.id, e.nome)}><Trash2 size={16} /></button>
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
          <div className="premium-modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Estado' : 'Editar Estado'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.5rem', marginBottom: '1.2rem' }}>
                    <div className="form-group">
                      <label htmlFor="uf" style={{ fontWeight: '600', color: '#475569' }}>UF *</label>
                      <input 
                        className="form-input" 
                        id="uf" 
                        value={formData.uf} 
                        onChange={handleChange} 
                        maxLength={2} 
                        placeholder="UF"
                        required 
                        style={{ textTransform: 'uppercase', width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="nome" style={{ fontWeight: '600', color: '#475569' }}>Nome do Estado *</label>
                      <input className="form-input" id="nome" value={formData.nome} onChange={handleChange} placeholder="Nome do Estado" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Estado ativo no sistema</label>
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
