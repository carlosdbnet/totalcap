import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Operadores.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Setor {
  id: number;
  descricao: string;
}

interface Departamento {
  id: number;
  descricao: string;
}

interface Operador {
  id: number;
  codigo: string;
  nome: string;
  cargo: string;
  id_setor: number | null;
  id_depto: number | null;
  ativo: boolean;
  setor?: { id: number; descricao: string };
  departamento?: { id: number; descricao: string };
}

export default function Operadores() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [filteredOperadores, setFilteredOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auxiliary data
  const [setores, setSetores] = useState<Setor[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    cargo: '',
    id_setor: '' as string | number,
    id_depto: '' as string | number,
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOperadores(operadores);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredOperadores(operadores.filter(o => 
        o.nome.toLowerCase().includes(lowerSearch) ||
        o.codigo?.toLowerCase().includes(lowerSearch) ||
        o.cargo?.toLowerCase().includes(lowerSearch) ||
        o.setor?.descricao.toLowerCase().includes(lowerSearch) ||
        o.departamento?.descricao.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, operadores]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/operadores/');
      setOperadores(response.data);
    } catch (error) {
      console.error("Erro ao buscar operadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [sRes, dRes] = await Promise.all([
        api.get('/setores/'),
        api.get('/departamentos/')
      ]);
      setSetores(sRes.data);
      setDepartamentos(dRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados auxiliares:", error);
    }
  };

  const openModal = (mode: 'create' | 'edit', operador?: Operador) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && operador) {
      setCurrentId(operador.id);
      setFormData({
        codigo: operador.codigo || '',
        nome: operador.nome,
        cargo: operador.cargo || '',
        id_setor: operador.id_setor || '',
        id_depto: operador.id_depto || '',
        ativo: operador.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        codigo: '',
        nome: '',
        cargo: '',
        id_setor: '',
        id_depto: '',
        ativo: true
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
    if (!formData.nome.trim()) {
      setFormError('O nome do operador é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload = {
      ...formData,
      id_setor: formData.id_setor === '' ? null : Number(formData.id_setor),
      id_depto: formData.id_depto === '' ? null : Number(formData.id_depto)
    };

    try {
      if (modalMode === 'create') {
        await api.post('/operadores/', payload);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/operadores/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar operador.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o operador "${nome}"?`)) {
      try {
        await api.delete(`/operadores/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir operador:", error);
        alert('Erro ao excluir o operador.');
      }
    }
  };

  return (
    <div className="operadores-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Operadores de Produção</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Operadores</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Operador
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nome, código, setor ou departamento..." 
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
                  <th style={{ width: '80px' }}>Código</th>
                  <th>Operador / Cargo</th>
                  <th>Setor / Departamento</th>
                  <th style={{ width: '80px' }}>Status</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperadores.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">Nenhum operador encontrado.</td></tr>
                ) : (
                  filteredOperadores.map(o => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td><strong>{o.codigo || '-'}</strong></td>
                      <td>
                        <div className="servico-info">
                          <span className="servico-desc">{o.nome}</span>
                          {o.cargo && <span className="servico-sub">{o.cargo}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="servico-info">
                          <span>{o.setor?.descricao || '-'}</span>
                          {o.departamento && <span className="servico-sub">{o.departamento.descricao}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${o.ativo ? 'active' : 'inactive'}`}>
                          {o.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', o)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(o.id, o.nome)}><Trash2 size={16} /></button>
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
              <h2>{modalMode === 'create' ? 'Novo Operador' : 'Editar Operador'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                    <div className="form-group">
                      <label htmlFor="codigo" style={{ fontWeight: '600', color: '#475569' }}>Código</label>
                      <input className="form-input" id="codigo" value={formData.codigo} onChange={handleChange} placeholder="Ex: OP01" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nome" style={{ fontWeight: '600', color: '#475569' }}>Nome Completo *</label>
                      <input className="form-input" id="nome" value={formData.nome} onChange={handleChange} placeholder="Nome do operador" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="cargo" style={{ fontWeight: '600', color: '#475569' }}>Cargo / Função</label>
                    <input className="form-input" id="cargo" value={formData.cargo} onChange={handleChange} placeholder="Ex: Vulcanizador" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                    <div className="form-group">
                      <label htmlFor="id_setor" style={{ fontWeight: '600', color: '#475569' }}>Setor</label>
                      <select className="form-select" id="id_setor" value={formData.id_setor} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                        <option value="">Selecione o Setor</option>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.descricao}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="id_depto" style={{ fontWeight: '600', color: '#475569' }}>Departamento</label>
                      <select className="form-select" id="id_depto" value={formData.id_depto} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                        <option value="">Selecione o Departamento</option>
                        {departamentos.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Operador ativo</label>
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
