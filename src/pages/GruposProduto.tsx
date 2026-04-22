import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer, Layers } from 'lucide-react';
import api from '../lib/api';
import './Medidas.css'; // Reusing Medidas styles
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface GrupoProduto {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export default function GruposProduto() {
  const [grupos, setGrupos] = useState<GrupoProduto[]>([]);
  const [filteredGrupos, setFilteredGrupos] = useState<GrupoProduto[]>([]);
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
      setFilteredGrupos(grupos);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredGrupos(grupos.filter(g => 
        g.descricao.toLowerCase().includes(lowerSearch) ||
        g.codigo?.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, grupos]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/grupos-produto/');
      setGrupos(response.data);
    } catch (error) {
      console.error("Erro ao buscar grupos de produto:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', grupo?: GrupoProduto) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && grupo) {
      setCurrentId(grupo.id);
      setFormData({
        codigo: grupo.codigo || '',
        descricao: grupo.descricao,
        ativo: grupo.ativo
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
        await api.post('/grupos-produto/', formData);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/grupos-produto/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar grupo de produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${descricao}"?`)) {
      try {
        await api.delete(`/grupos-produto/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir grupo de produto:", error);
        alert('Erro ao excluir o grupo de produto.');
      }
    }
  };

  return (
    <div className="medidas-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Grupos de Produto</h1>
      </div>

      <div className="page-header">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={24} />
          Grupos de Produto
        </h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Grupo
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar grupos..." 
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
                  <th>Descrição do Grupo</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrupos.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Nenhum grupo encontrado.</td></tr>
                ) : (
                  filteredGrupos.map(g => (
                    <tr key={g.id}>
                      <td>#{g.id}</td>
                      <td><strong>{g.codigo || '-'}</strong></td>
                      <td><strong>{g.descricao}</strong></td>
                      <td>
                        <span className={`status-badge ${g.ativo ? 'active' : 'inactive'}`}>
                          {g.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', g)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(g.id, g.descricao)}><Trash2 size={16} /></button>
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
              <h2>{modalMode === 'create' ? 'Novo Grupo' : 'Editar Grupo'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-group">
                  <label htmlFor="codigo">Código</label>
                  <input 
                    className="form-input" 
                    id="codigo" 
                    value={formData.codigo} 
                    onChange={handleChange} 
                    placeholder="Ex: 001, GRP, etc."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="descricao">Descrição do Grupo *</label>
                  <input 
                    className="form-input" 
                    id="descricao" 
                    value={formData.descricao} 
                    onChange={handleChange} 
                    placeholder="Ex: Bandas, Consumíveis, etc."
                    required 
                  />
                </div>

                <div className="form-group">
                  <div className="checkbox-group" style={{ marginTop: '1rem' }}>
                    <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                    <label htmlFor="ativo">Grupo ativo no sistema</label>
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
