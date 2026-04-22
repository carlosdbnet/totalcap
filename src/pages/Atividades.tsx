import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api from '../lib/api';
import './Atividades.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Atividade {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export default function Atividades() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [filteredAtividades, setFilteredAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAtividades();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAtividades(atividades);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredAtividades(atividades.filter(a => 
        a.descricao.toLowerCase().includes(lowerSearch) || 
        a.codigo.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, atividades]);

  const fetchAtividades = async () => {
    try {
      setLoading(true);
      const response = await api.get('/atividades/');
      setAtividades(response.data);
    } catch (error) {
      console.error("Erro ao buscar atividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', atividade?: Atividade) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && atividade) {
      setCurrentId(atividade.id);
      setCodigo(atividade.codigo);
      setDescricao(atividade.descricao);
      setAtivo(atividade.ativo);
    } else {
      setCurrentId(null);
      setCodigo('');
      setDescricao('');
      setAtivo(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !descricao.trim()) {
      setFormError('Código e Descrição são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/atividades/', { codigo, descricao, ativo });
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/atividades/${currentId}`, { codigo, descricao, ativo });
      }
      await fetchAtividades();
      closeModal();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Ocorreu um erro ao salvar a atividade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, desc: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a atividade "${desc}"?`)) {
      try {
        await api.delete(`/atividades/${id}`);
        await fetchAtividades();
      } catch (error) {
        console.error("Erro ao excluir atividade:", error);
        alert('Erro ao excluir a atividade.');
      }
    }
  };

  return (
    <div className="atividades-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Atividades</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Cadastros de Atividades</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Nova Atividade
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar atividades..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

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
              {filteredAtividades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {searchTerm ? "Nenhuma atividade encontrada." : "Nenhuma atividade cadastrada."}
                  </td>
                </tr>
              ) : (
                filteredAtividades.map((atividade) => (
                  <tr key={atividade.id}>
                    <td>#{atividade.id}</td>
                    <td><strong>{atividade.codigo}</strong></td>
                    <td>{atividade.descricao}</td>
                    <td>
                      <span className={`status-badge ${atividade.ativo ? 'active' : 'inactive'}`}>
                        {atividade.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={() => openModal('edit', atividade)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(atividade.id, atividade.descricao)}>
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
              <h2>{modalMode === 'create' ? 'Nova Atividade' : 'Editar Atividade'}</h2>
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
                    placeholder="Ex: SERV, ADM, etc"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="descricao">Descrição *</label>
                  <input
                    type="text"
                    id="descricao"
                    className="form-input"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descrição da atividade"
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
                  <label htmlFor="ativo">Atividade ativa</label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
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
