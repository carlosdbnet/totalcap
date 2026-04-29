import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users, Shield, UserCheck, UserMinus, Mail, Lock, User } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Operadores.css'; // Reutilizando os estilos base de cadastros

interface Usuario {
  id: number;
  nome: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    is_active: true,
    is_superuser: false
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsuarios(usuarios);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredUsuarios(usuarios.filter(u => 
        u.nome.toLowerCase().includes(lowerSearch) ||
        u.email.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, usuarios]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios/');
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', usuario?: Usuario) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && usuario) {
      setCurrentId(usuario.id);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        password: '', // Senha sempre vazia na edição a menos que queira trocar
        is_active: usuario.is_active,
        is_superuser: usuario.is_superuser
      });
    } else {
      setCurrentId(null);
      setFormData({
        nome: '',
        email: '',
        password: '',
        is_active: true,
        is_superuser: false
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.email.trim()) {
      setFormError('Nome e E-mail são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload: any = { ...formData };
    // Se for edição e a senha estiver vazia, removemos do payload
    if (modalMode === 'edit' && !payload.password) {
      delete payload.password;
    }

    try {
      if (modalMode === 'create') {
        await api.post('/usuarios/', payload);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/usuarios/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar usuário.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
      try {
        await api.delete(`/usuarios/${id}`);
        await fetchData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Erro ao excluir o usuário.');
      }
    }
  };

  return (
    <div className="operadores-container"> {/* Reutilizando container de estilo */}
      <div className="page-header">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={32} className="text-blue-500" />
          Gestão de Usuários
        </h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
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
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Nome Completo</th>
                  <th>E-mail</th>
                  <th style={{ width: '120px' }}>Nível</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">Nenhum usuário encontrado.</td></tr>
                ) : (
                  filteredUsuarios.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <div className="servico-info">
                          <span className="servico-desc" style={{ fontWeight: '600' }}>{u.nome}</span>
                        </div>
                      </td>
                      <td>
                        <div className="servico-info">
                          <span className="text-slate-400" style={{ fontSize: '0.9rem' }}>{u.email}</span>
                        </div>
                      </td>
                      <td>
                        {u.is_superuser ? (
                          <span className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            Administrador
                          </span>
                        ) : (
                          <span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            Padrão
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn-icon-premium edit" 
                            onClick={() => openModal('edit', u)}
                            title="Editar"
                            style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon-premium delete" 
                            onClick={() => handleDelete(u.id, u.nome)}
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
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="premium-modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {modalMode === 'create' ? <Plus size={24} /> : <Edit2 size={24} />}
                {modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
              </h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error" style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fecaca' }}>{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="nome" style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Nome Completo *</label>
                    <input className="form-input" id="nome" value={formData.nome} onChange={handleChange} placeholder="Nome do usuário" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="email" style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>E-mail de Acesso *</label>
                    <input className="form-input" id="email" type="email" value={formData.email} onChange={handleChange} placeholder="exemplo@totalcap.com" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="password" style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                      {modalMode === 'create' ? 'Senha Provisória *' : 'Nova Senha (deixe em branco para manter)'}
                    </label>
                    <input className="form-input" id="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required={modalMode === 'create'} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                    <div className="form-group">
                      <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <input type="checkbox" id="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                        <label htmlFor="is_active" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500', cursor: 'pointer' }}>Usuário Ativo</label>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.75rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px' }}>
                        <input type="checkbox" id="is_superuser" checked={formData.is_superuser} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                        <label htmlFor="is_superuser" style={{ fontSize: '0.9rem', color: '#92400e', fontWeight: '600', cursor: 'pointer' }}>Administrador</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="premium-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: '#3b82f6' }}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
