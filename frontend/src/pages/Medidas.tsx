import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Medidas.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Medida {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export default function Medidas() {
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [filteredMedidas, setFilteredMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
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
      setFilteredMedidas(medidas);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredMedidas(medidas.filter(m => 
        m.descricao.toLowerCase().includes(lowerSearch) ||
        m.codigo?.toLowerCase().includes(lowerSearch)
      ));
    }
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, medidas]);

  // Paginated Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMedidas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMedidas.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medidas/');
      setMedidas(response.data);
    } catch (error) {
      console.error("Erro ao buscar medidas:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', medida?: Medida) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && medida) {
      setCurrentId(medida.id);
      setFormData({
        codigo: medida.codigo || '',
        descricao: medida.descricao,
        ativo: medida.ativo
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
    if (!formData.descricao.trim()) {
      setFormError('A descrição é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/medidas/', formData);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/medidas/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar medida.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a medida "${descricao}"?`)) {
      try {
        await api.delete(`/medidas/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir medida:", error);
        alert('Erro ao excluir a medida.');
      }
    }
  };

  return (
    <div className="medidas-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Medidas de Pneu</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Medidas</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Nova Medida
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar medidas..." 
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
                  <th style={{ width: '100px' }}>Código</th>
                  <th>Descrição da Medida</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Nenhuma medida encontrada.</td></tr>
                ) : (
                  currentItems.map(m => (
                    <tr key={m.id}>
                      <td>#{m.id}</td>
                      <td><strong>{m.codigo || '-'}</strong></td>
                      <td><strong>{m.descricao}</strong></td>
                      <td>
                        <span className={`status-badge ${m.ativo ? 'active' : 'inactive'}`}>
                          {m.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn-icon-premium edit" 
                            onClick={() => openModal('edit', m)}
                            title="Editar"
                            style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon-premium delete" 
                            onClick={() => handleDelete(m.id, m.descricao)}
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

        {/* Paginação */}
        {!loading && filteredMedidas.length > itemsPerPage && (
          <div className="pagination-container" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1.5rem 2rem',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div className="pagination-info" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a <strong>{Math.min(indexOfLastItem, filteredMedidas.length)}</strong> de <strong>{filteredMedidas.length}</strong> medidas
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
          <div className="premium-modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Nova Medida' : 'Editar Medida'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="codigo" style={{ fontWeight: '600', color: '#475569' }}>Código</label>
                    <input 
                      className="form-input" 
                      id="codigo" 
                      value={formData.codigo} 
                      onChange={handleChange} 
                      placeholder="Ex: 001, 295, etc."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="descricao" style={{ fontWeight: '600', color: '#475569' }}>Descrição da Medida *</label>
                    <input 
                      className="form-input" 
                      id="descricao" 
                      value={formData.descricao} 
                      onChange={handleChange} 
                      placeholder="Ex: 295/80 R22.5"
                      required 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Medida ativa no sistema</label>
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
