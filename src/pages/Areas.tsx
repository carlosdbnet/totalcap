import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api from '../lib/api';
import './Areas.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Area {
  id: number;
  codigo: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
}

export default function Areas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAreas(areas);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredAreas(areas.filter(a => 
        a.nome.toLowerCase().includes(lowerSearch) || 
        a.codigo.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, areas]);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await api.get('/areas/');
      console.log("Áreas carregadas:", response.data);
      setAreas(response.data);
    } catch (error: any) {
      console.error("Erro ao buscar áreas:", error);
      setFetchError(error.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', area?: Area) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && area) {
      setCurrentId(area.id);
      setCodigo(area.codigo);
      setNome(area.nome);
      setAtivo(area.ativo);
    } else {
      setCurrentId(null);
      setCodigo('');
      setNome('');
      setAtivo(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nome.trim()) {
      setFormError('Código e Nome são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/areas/', { codigo, nome, ativo });
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/areas/${currentId}`, { codigo, nome, ativo });
      }
      await fetchAreas();
      closeModal();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Ocorreu um erro ao salvar a área.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, nomeArea: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a área "${nomeArea}"? Esta ação não pode ser desfeita.`)) {
      try {
        await api.delete(`/areas/${id}`);
        await fetchAreas();
      } catch (error) {
        console.error("Erro ao excluir área:", error);
        alert('Erro ao excluir a área. Ela pode estar vinculada a outro registro.');
      }
    }
  };

  return (
    <div className="areas-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Áreas</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Cadastros de Áreas</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchAreas} title="Recarregar dados">
            <Search size={20} />
            Atualizar Lista
          </button>
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Nova Área
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar áreas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {fetchError && (
          <div className="error-banner" style={{ margin: '0 1.5rem 1rem 1.5rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={20} />
            <span>Erro ao carregar áreas: {fetchError}. Verifique a conexão com o servidor.</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Carregando dados...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '120px' }}>Código</th>
                <th>Descrição</th>
                <th>Status</th>
                <th style={{ width: '120px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {searchTerm ? "Nenhuma área encontrada." : "Nenhuma área cadastrada."}
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area) => (
                  <tr key={area.id}>
                    <td>#{area.id}</td>
                    <td><strong>{area.codigo}</strong></td>
                    <td>{area.nome}</td>
                    <td>
                      <span className={`status-badge ${area.ativo ? 'active' : 'inactive'}`}>
                        {area.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="icon-btn edit" 
                          onClick={() => openModal('edit', area)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="icon-btn delete" 
                          onClick={() => handleDelete(area.id, area.nome)}
                          title="Excluir"
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

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Nova Área' : 'Editar Área'}</h2>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-group">
                  <label htmlFor="codigo">Código *</label>
                  <input
                    type="text"
                    id="codigo"
                    className="form-input"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ex: INSP, RASP, etc"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nome">Descrição *</label>
                  <input
                    type="text"
                    id="nome"
                    className="form-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Descrição da área"
                    required
                  />
                </div>
                
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                  <label htmlFor="ativo">Área ativa no sistema</label>
                </div>
              </div>
              
              <div className="modal-footer">
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
