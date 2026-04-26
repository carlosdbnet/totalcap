import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Package } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Marcas.css'; // reuse same CSS

interface Produto {
  id: number;
  codprod: string;
  id_grupo: number | null;
  descricao: string;
  unidade: string | null;
  precoven: number;
  ativo: boolean;
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<any[]>([]); // Changed to any to include nested group
  const [filteredProdutos, setFilteredProdutos] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    codprod: '',
    id_grupo: 0,
    descricao: '',
    unidade: '',
    precoven: 0,
    ativo: true
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProdutos(produtos);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredProdutos(produtos.filter(p =>
        p.descricao?.toLowerCase().includes(lower) ||
        p.codprod?.toLowerCase().includes(lower)
      ));
    }
  }, [searchTerm, produtos]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, gruposRes] = await Promise.all([
        api.get('/produtos/'),
        api.get('/grupos-produto/')
      ]);
      setProdutos(prodRes.data);
      setGrupos(gruposRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', produto?: Produto) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && produto) {
      setCurrentId(produto.id);
      setFormData({
        codprod: produto.codprod || '',
        id_grupo: produto.id_grupo || 0,
        descricao: produto.descricao || '',
        unidade: produto.unidade || '',
        precoven: produto.precoven || 0,
        ativo: produto.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({ codprod: '', id_grupo: 0, descricao: '', unidade: '', precoven: 0, ativo: true });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codprod.trim() || !formData.descricao.trim()) {
      setFormError('Código e descrição são obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    const payload = { ...formData, id_grupo: Number(formData.id_grupo) || null, precoven: Number(formData.precoven) || 0 };
    try {
      if (modalMode === 'create') {
        await api.post('/produtos/', payload);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/produtos/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar produto.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (window.confirm(`Excluir o produto "${descricao}"?`)) {
      try {
        await api.delete(`/produtos/${id}`);
        await fetchData();
      } catch {
        alert('Erro ao excluir o produto.');
      }
    }
  };

  return (
    <div className="marcas-container">
      <div className="page-header">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Package size={28} color="var(--primary-color)" />
          Produtos
        </h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por código ou descrição..."
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
                  <th style={{ width: '120px' }}>Código</th>
                  <th>Descrição</th>
                  <th>Grupo</th>
                  <th style={{ width: '80px' }}>Unid.</th>
                  <th style={{ width: '110px' }}>Preço Venda</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProdutos.length === 0 ? (
                  <tr><td colSpan={9} className="empty-state">Nenhum produto encontrado.</td></tr>
                ) : (
                  filteredProdutos.map(p => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td><strong>{p.codprod}</strong></td>
                      <td>{p.descricao || '-'}</td>
                      <td>
                        <span className="info-badge" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary-color)' }}>
                          {p.grupo?.descricao || 'Sem Grupo'}
                        </span>
                      </td>
                      <td>{p.unidade || '-'}</td>
                      <td><strong>R$ {(p.precoven || 0).toFixed(2)}</strong></td>
                      <td>
                        <span className={`status-badge ${p.ativo ? 'active' : 'inactive'}`}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', p)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(p.id, p.descricao || p.codprod)}><Trash2 size={16} /></button>
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
              <h2>{modalMode === 'create' ? 'Novo Produto' : 'Editar Produto'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                    <div className="form-group">
                      <label htmlFor="codprod" style={{ fontWeight: '600', color: '#475569' }}>Código *</label>
                      <input className="form-input" id="codprod" value={formData.codprod} onChange={handleChange} placeholder="Ex: 001" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="id_grupo" style={{ fontWeight: '600', color: '#475569' }}>Grupo do Produto</label>
                      <select 
                        className="form-input" 
                        id="id_grupo" 
                        value={formData.id_grupo || ''} 
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                      >
                        <option value="">Selecione um grupo...</option>
                        {grupos.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.descricao} {g.codigo ? `(${g.codigo})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label htmlFor="descricao" style={{ fontWeight: '600', color: '#475569' }}>Descrição *</label>
                      <input className="form-input" id="descricao" value={formData.descricao} onChange={handleChange} placeholder="Ex: Banda 275" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="unidade" style={{ fontWeight: '600', color: '#475569' }}>Unidade</label>
                      <input className="form-input" id="unidade" value={formData.unidade} onChange={handleChange} placeholder="Ex: UN, KG, MT" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="precoven" style={{ fontWeight: '600', color: '#475569' }}>Preço de Venda (R$)</label>
                      <input type="number" step="0.01" className="form-input" id="precoven" value={formData.precoven} onChange={handleChange} placeholder="0,00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ marginTop: '1.2rem' }}>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Produto ativo no sistema</label>
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
