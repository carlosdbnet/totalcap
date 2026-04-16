import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api from '../lib/api';
import './Desenhos.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Desenho {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export default function Desenhos() {
  const [desenhos, setDesenhos] = useState<Desenho[]>([]);
  const [filteredDesenhos, setFilteredDesenhos] = useState<Desenho[]>([]);
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
      setFilteredDesenhos(desenhos);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredDesenhos(desenhos.filter(d => 
        d.descricao.toLowerCase().includes(lowerSearch) ||
        d.codigo?.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, desenhos]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/desenhos/');
      setDesenhos(response.data);
    } catch (error) {
      console.error("Erro ao buscar desenhos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', desenho?: Desenho) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && desenho) {
      setCurrentId(desenho.id);
      setFormData({
        codigo: desenho.codigo || '',
        descricao: desenho.descricao,
        ativo: desenho.ativo
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
      setFormError('A descrição do desenho é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/desenhos/', formData);
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/desenhos/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar desenho.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o desenho "${descricao}"?`)) {
      try {
        await api.delete(`/desenhos/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir desenho:", error);
        alert('Erro ao excluir o desenho.');
      }
    }
  };

  return (
    <div className="desenhos-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Desenhos de Banda</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Desenhos</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Desenho
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar desenhos..." 
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
                  <th>Descrição do Desenho</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDesenhos.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Nenhum desenho encontrado.</td></tr>
                ) : (
                  filteredDesenhos.map(d => (
                    <tr key={d.id}>
                      <td>#{d.id}</td>
                      <td><strong>{d.codigo || '-'}</strong></td>
                      <td><strong>{d.descricao}</strong></td>
                      <td>
                        <span className={`status-badge ${d.ativo ? 'active' : 'inactive'}`}>
                          {d.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', d)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(d.id, d.descricao)}><Trash2 size={16} /></button>
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
              <h2>{modalMode === 'create' ? 'Novo Desenho' : 'Editar Desenho'}</h2>
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
                    placeholder="Ex: 001, M729, etc."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="descricao">Descrição do Desenho *</label>
                  <input 
                    className="form-input" 
                    id="descricao" 
                    value={formData.descricao} 
                    onChange={handleChange} 
                    placeholder="Ex: M729, G358, etc."
                    required 
                  />
                </div>

                <div className="form-group">
                  <div className="checkbox-group" style={{ marginTop: '1rem' }}>
                    <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                    <label htmlFor="ativo">Desenho ativo no sistema</label>
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
