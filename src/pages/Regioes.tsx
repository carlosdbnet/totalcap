import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api from '../lib/api';
import './Regioes.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Regiao {
  id: number;
  codigo: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
}

export default function Regioes() {
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [filteredRegioes, setFilteredRegioes] = useState<Regiao[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchRegioes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRegioes(regioes);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredRegioes(regioes.filter(r => 
        r.nome.toLowerCase().includes(lowerSearch) || 
        r.codigo.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, regioes]);

  const fetchRegioes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/regioes/');
      setRegioes(response.data);
    } catch (error) {
      console.error("Erro ao buscar regiões:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', regiao?: Regiao) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && regiao) {
      setCurrentId(regiao.id);
      setCodigo(regiao.codigo);
      setNome(regiao.nome);
      setAtivo(regiao.ativo);
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
        await api.post('/regioes/', { codigo, nome, ativo });
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/regioes/${currentId}`, { codigo, nome, ativo });
      }
      await fetchRegioes();
      closeModal();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Ocorreu um erro ao salvar a região.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, nomeRegiao: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a região "${nomeRegiao}"?`)) {
      try {
        await api.delete(`/regioes/${id}`);
        await fetchRegioes();
      } catch (error) {
        console.error("Erro ao excluir região:", error);
        alert('Erro ao excluir a região. Verifique se existem dependências.');
      }
    }
  };

  return (
    <div className="regioes-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Regiões</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Cadastros de Regiões</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Nova Região
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar regiões..." 
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
              {filteredRegioes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {searchTerm ? "Nenhuma região encontrada." : "Nenhuma região cadastrada."}
                  </td>
                </tr>
              ) : (
                filteredRegioes.map((regiao) => (
                  <tr key={regiao.id}>
                    <td>#{regiao.id}</td>
                    <td><strong>{regiao.codigo}</strong></td>
                    <td>{regiao.nome}</td>
                    <td>
                      <span className={`status-badge ${regiao.ativo ? 'active' : 'inactive'}`}>
                        {regiao.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={() => openModal('edit', regiao)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(regiao.id, regiao.nome)}>
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
              <h2>{modalMode === 'create' ? 'Nova Região' : 'Editar Região'}</h2>
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
                    placeholder="Ex: R-01, SUL, etc"
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
                    placeholder="Nome descritivo"
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
                  <label htmlFor="ativo">Região ativa</label>
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
