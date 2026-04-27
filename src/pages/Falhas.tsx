import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';

interface Falha {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export default function Falhas() {
  console.log("Componente Falhas renderizado");
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [filteredFalhas, setFilteredFalhas] = useState<Falha[]>([]);
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
      setFilteredFalhas(falhas);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredFalhas(falhas.filter(f => 
        f.descricao.toLowerCase().includes(lowerSearch) ||
        f.codigo?.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, falhas]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/falhas/tipofalhas/');
      setFalhas(response.data);
      setFilteredFalhas(response.data);
    } catch (error) {
      console.error("Erro ao buscar tipos de falha:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', falha?: Falha) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && falha) {
      setCurrentId(falha.id);
      setFormData({
        codigo: falha.codigo || '',
        descricao: falha.descricao,
        ativo: falha.ativo
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/falhas/tipofalhas/', formData);
      } else {
        await api.put(`/falhas/tipofalhas/${currentId}`, formData);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      setFormError(getErrorMessage(error, "Erro ao salvar tipo de falha"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este tipo de falha?')) return;
    try {
      await api.delete(`/falhas/tipofalhas/${id}`);
      fetchData();
    } catch (error: any) {
      alert(getErrorMessage(error, "Erro ao excluir tipo de falha"));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title-group">
          <AlertTriangle className="header-icon" style={{ color: '#ef4444' }} />
          <div>
            <h1>Tipos de Falha</h1>
            <p>Gerenciamento do dicionário de defeitos e problemas técnicos</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => openModal('create')} style={{ background: '#ef4444' }}>
          <Plus size={20} /> Novo Tipo de Falha
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center' }}>Carregando...</td></tr>
            ) : filteredFalhas.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center' }}>Nenhum tipo de falha encontrado.</td></tr>
            ) : (
              filteredFalhas.map(f => (
                <tr key={f.id}>
                  <td>{f.codigo}</td>
                  <td style={{ fontWeight: 600 }}>{f.descricao}</td>
                  <td>
                    <span className={`status-badge ${f.ativo ? 'active' : 'inactive'}`}>
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={() => openModal('edit', f)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(f.id)} title="Excluir">
                        <Trash2 size={16} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="premium-modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Tipo de Falha' : 'Editar Tipo de Falha'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px' }}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Código *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={formData.codigo}
                      onChange={e => setFormData({...formData, codigo: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Descrição *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={formData.descricao}
                      onChange={e => setFormData({...formData, descricao: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-checkbox">
                    <input 
                      type="checkbox" 
                      id="ativo"
                      checked={formData.ativo}
                      onChange={e => setFormData({...formData, ativo: e.target.checked})}
                    />
                    <label htmlFor="ativo">Ativo</label>
                  </div>
                </div>
              </div>
              
              <div className="premium-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: '#ef4444' }}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
