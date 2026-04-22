import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api from '../lib/api';
import './TipoRecapagem.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface TipoRecapagem {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export default function TipoRecapagem() {
  const [tipos, setTipos] = useState<TipoRecapagem[]>([]);
  const [filteredTipos, setFilteredTipos] = useState<TipoRecapagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTipos(tipos);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredTipos(tipos.filter(t => 
        t.descricao.toLowerCase().includes(lowerSearch) ||
        t.codigo.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, tipos]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tipo-recapagem/');
      setTipos(response.data);
    } catch (error) {
      console.error("Erro ao buscar tipos de recapagem:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', tipo?: TipoRecapagem) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && tipo) {
      setCurrentId(tipo.id);
      setFormData({
        codigo: tipo.codigo,
        descricao: tipo.descricao,
        ativo: tipo.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        codigo: '',
        descricao: '',
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
    if (!formData.codigo.trim() || !formData.descricao.trim()) {
      setFormError('Código e Descrição são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/tipo-recapagem/', formData);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/tipo-recapagem/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar tipo de recapagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o tipo de recapagem "${descricao}"?`)) {
      try {
        await api.delete(`/tipo-recapagem/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir tipo de recapagem:", error);
        alert('Erro ao excluir o tipo de recapagem.');
      }
    }
  };

  return (
    <div className="tipo-recapagem-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Tipos de Recapagem</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Tipos de Recapagem</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Tipo
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar tipos de recapagem..." 
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
                  <th style={{ width: '120px' }}>Código</th>
                  <th>Descrição</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTipos.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Nenhum tipo de recapagem encontrado.</td></tr>
                ) : (
                  filteredTipos.map(t => (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td><strong>{t.codigo}</strong></td>
                      <td>{t.descricao}</td>
                      <td>
                        <span className={`status-badge ${t.ativo ? 'active' : 'inactive'}`}>
                          {t.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', t)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(t.id, t.descricao)}><Trash2 size={16} /></button>
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
              <h2>{modalMode === 'create' ? 'Novo Tipo de Recapagem' : 'Editar Tipo de Recapagem'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-group">
                  <label htmlFor="codigo">Código *</label>
                  <input 
                    className="form-input" 
                    id="codigo" 
                    value={formData.codigo} 
                    onChange={handleChange} 
                    placeholder="Ex: 01, 100, etc."
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="descricao">Descrição *</label>
                  <input 
                    className="form-input" 
                    id="descricao" 
                    value={formData.descricao} 
                    onChange={handleChange} 
                    placeholder="Ex: Recapagem Fria, Vulcanização, etc."
                    required 
                  />
                </div>

                <div className="form-group">
                  <div className="checkbox-group" style={{ marginTop: '1rem' }}>
                    <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                    <label htmlFor="ativo">Tipo ativo no sistema</label>
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
