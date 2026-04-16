import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api from '../lib/api';
import './Cidades.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Cidade {
  id: number;
  nome: string;
  uf: string;
  codibge: string;
  ativo: boolean;
}

export default function Cidades() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [filteredCidades, setFilteredCidades] = useState<Cidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    uf: '',
    codibge: '',
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCidades(cidades);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredCidades(cidades.filter(c => 
        c.nome.toLowerCase().includes(lowerSearch) || 
        c.uf.toLowerCase().includes(lowerSearch) ||
        c.codibge?.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, cidades]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cidades/');
      setCidades(response.data);
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', cidade?: Cidade) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && cidade) {
      setCurrentId(cidade.id);
      setFormData({
        nome: cidade.nome,
        uf: cidade.uf,
        codibge: cidade.codibge || '',
        ativo: cidade.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        nome: '',
        uf: '',
        codibge: '',
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
    if (!formData.nome.trim() || !formData.uf.trim()) {
      setFormError('Nome e UF são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/cidades/', formData);
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/cidades/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar cidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a cidade "${nome}"?`)) {
      try {
        await api.delete(`/cidades/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir cidade:", error);
        alert('Erro ao excluir a cidade.');
      }
    }
  };

  return (
    <div className="cidades-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Cidades</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Cidades</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Nova Cidade
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar cidades..." 
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
                  <th>Cidade</th>
                  <th style={{ width: '80px' }}>UF</th>
                  <th>Cód. IBGE</th>
                  <th>Status</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCidades.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">Nenhuma cidade encontrada.</td></tr>
                ) : (
                  filteredCidades.map(c => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td><strong>{c.nome}</strong></td>
                      <td>{c.uf}</td>
                      <td>{c.codibge || '-'}</td>
                      <td>
                        <span className={`status-badge ${c.ativo ? 'active' : 'inactive'}`}>
                          {c.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', c)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(c.id, c.nome)}><Trash2 size={16} /></button>
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
              <h2>{modalMode === 'create' ? 'Nova Cidade' : 'Editar Cidade'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-group">
                  <label htmlFor="nome">Nome da Cidade *</label>
                  <input className="form-input" id="nome" value={formData.nome} onChange={handleChange} required />
                </div>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="uf">UF *</label>
                    <input className="form-input" id="uf" value={formData.uf} onChange={handleChange} maxLength={2} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="codibge">Código IBGE</label>
                    <input className="form-input" id="codibge" value={formData.codibge} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group" style={{ marginTop: '1rem' }}>
                    <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                    <label htmlFor="ativo">Cidade ativa no sistema</label>
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
