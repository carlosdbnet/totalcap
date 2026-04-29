import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer, FileText, Hash } from 'lucide-react';
import api from '../lib/api';
import './TiposDocto.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface TipoDocto {
  id: number;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}

export default function TiposDocto() {
  const [tipos, setTipos] = useState<TipoDocto[]>([]);
  const [filteredTipos, setFilteredTipos] = useState<TipoDocto[]>([]);
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
    descricao: '',
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTipos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTipos(tipos);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredTipos(tipos.filter(t => 
        (t.descricao && t.descricao.toLowerCase().includes(lowerSearch)) || 
        t.codigo.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, tipos]);

  const fetchTipos = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await api.get('/tipos-docto/');
      setTipos(response.data);
    } catch (error: any) {
      console.error("Erro ao buscar tipos de documento:", error);
      setFetchError(error.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', tipo?: TipoDocto) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && tipo) {
      setCurrentId(tipo.id);
      setFormData({
        codigo: tipo.codigo,
        descricao: tipo.descricao || '',
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

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim()) {
      setFormError('O Código é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/tipos-docto/', formData);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/tipos-docto/${currentId}`, formData);
      }
      await fetchTipos();
      closeModal();
    } catch (err: any) {
      console.error("Erro ao salvar tipo de documento:", err);
      const detail = err.response?.data?.detail;
      const errorMessage = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : 'Ocorreu um erro ao salvar o tipo de documento.');
      
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, desc: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o tipo de documento "${desc}"?`)) {
      try {
        await api.delete(`/tipos-docto/${id}`);
        await fetchTipos();
      } catch (error) {
        console.error("Erro ao excluir tipo de documento:", error);
        alert('Erro ao excluir o tipo de documento.');
      }
    }
  };

  return (
    <div className="tipos-docto-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Tipos de Documento</h1>
      </div>

      <div className="page-header">
        <div className="title-group">
          <FileText size={28} className="title-icon" />
          <h1 className="title">Tipos de Documento</h1>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => window.print()}>
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
              placeholder="Buscar por código ou descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {fetchError && (
          <div className="error-banner">
            <span>Erro ao carregar dados: {fetchError}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Carregando dados...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Código</th>
                  <th>Descrição</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTipos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      {searchTerm ? "Nenhum tipo de documento encontrado." : "Nenhum tipo de documento cadastrado."}
                    </td>
                  </tr>
                ) : (
                  filteredTipos.map((tipo) => (
                    <tr key={tipo.id}>
                      <td><strong>{tipo.codigo}</strong></td>
                      <td>{tipo.descricao || '-'}</td>
                      <td>
                        <span className={`status-badge ${tipo.ativo ? 'active' : 'inactive'}`}>
                          {tipo.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn-icon-premium edit" 
                            onClick={() => openModal('edit', tipo)}
                            title="Editar"
                            style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon-premium delete" 
                            onClick={() => handleDelete(tipo.id, tipo.descricao || tipo.codigo)}
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
          <div className="premium-modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="modal-title-group">
                <FileText size={24} className="modal-title-icon" />
                <h2>{modalMode === 'create' ? 'Novo Tipo de Documento' : 'Editar Tipo de Documento'}</h2>
              </div>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}><Hash size={14} /> Código *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                      placeholder="Ex: NFE"
                      maxLength={5}
                      required
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}><FileText size={14} /> Descrição</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      placeholder="Ex: Nota Fiscal Eletrônica"
                      maxLength={30}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  
                  <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Tipo de documento ativo</label>
                  </div>
                </div>
              </div>
              
              <div className="premium-modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
