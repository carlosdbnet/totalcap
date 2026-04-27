import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Servicos.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Medida { id: number; descricao: string; }
interface Desenho { id: number; descricao: string; }
interface Produto { id: number; descricao: string; codprod: string; }
interface TipoRecapagem { id: number; descricao: string; codigo: string; }

interface Servico {
  id: number;
  codigo: string;
  descricao: string;
  id_medida: number | null;
  id_desenho: number | null;
  id_produto: number | null;
  id_recap: number | null;
  ativo: boolean;
  grupo: string | null;
  medida?: { id: number; descricao: string };
  desenho?: { id: number; descricao: string };
  produto?: { id: number; descricao: string };
  recap?: { id: number; descricao: string };
  valor: number;
}

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [filteredServicos, setFilteredServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Auxiliary data
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [desenhos, setDesenhos] = useState<Desenho[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [tiposRecap, setTiposRecap] = useState<TipoRecapagem[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Produto autocomplete state
  const [produtoSearchQuery, setProdutoSearchQuery] = useState('');
  const [showProdutoSuggestions, setShowProdutoSuggestions] = useState(false);
  const produtoRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    id_medida: '' as string | number,
    id_desenho: '' as string | number,
    id_produto: '' as string | number,
    id_recap: '' as string | number,
    valor: '' as string | number,
    ativo: true,
    grupo: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    fetchAuxiliaryData();
  }, []);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (produtoRef.current && !produtoRef.current.contains(e.target as Node)) {
        setShowProdutoSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredServicos(servicos);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredServicos(servicos.filter(s =>
        s.descricao.toLowerCase().includes(lowerSearch) ||
        s.codigo?.toLowerCase().includes(lowerSearch) ||
        s.medida?.descricao.toLowerCase().includes(lowerSearch) ||
        s.produto?.descricao.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, servicos]);

  // Auto-generate código e descrição
  useEffect(() => {
    // Only auto-generate if we are creating or if the user changed the IDs
    // We check if the values are actually different from the current formData to avoid loops
    // and we only run if the auxiliary data is loaded.
    
    if (medidas.length === 0 || desenhos.length === 0 || tiposRecap.length === 0) return;

    // Rule 1: Product Priority (only if id_produto is set and > 0)
    if (formData.id_produto && Number(formData.id_produto) > 0) {
      const prod = produtos.find(p => p.id === Number(formData.id_produto));
      if (prod) {
        const novoCodigo = prod.codprod || '';
        const novaDescricao = prod.descricao || '';
        if (formData.codigo !== novoCodigo || formData.descricao !== novaDescricao) {
          setFormData(prev => ({ ...prev, codigo: novoCodigo, descricao: novaDescricao }));
        }
        return;
      }
    }

    // Rule 2: Medida + Desenho + Tipo Recapagem
    if (Number(formData.id_medida) > 0 && Number(formData.id_desenho) > 0 && Number(formData.id_recap) > 0) {
      const med = medidas.find(m => m.id === Number(formData.id_medida));
      const des = desenhos.find(d => d.id === Number(formData.id_desenho));
      const rec = tiposRecap.find(r => r.id === Number(formData.id_recap));

      if (med && des && rec) {
        const novoCodigo = `${Number(formData.id_medida)}.${Number(formData.id_desenho)}.${Number(formData.id_recap)}`;
        const novaDescricao = `${med.descricao.trim()} ${des.descricao.trim()} ${rec.codigo.trim()}`;
        if (formData.codigo !== novoCodigo || formData.descricao !== novaDescricao) {
          setFormData(prev => ({ ...prev, codigo: novoCodigo, descricao: novaDescricao }));
        }
      }
    }
  }, [formData.id_medida, formData.id_desenho, formData.id_recap, formData.id_produto, produtos, medidas, desenhos, tiposRecap]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/servicos/');
      setServicos(response.data);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [mRes, dRes, maRes, rRes] = await Promise.all([
        api.get('/medidas/'),
        api.get('/desenhos/'),
        api.get('/produtos/'),
        api.get('/tipo-recapagem/')
      ]);
      setMedidas(mRes.data);
      setDesenhos(dRes.data);
      setProdutos(maRes.data);
      setTiposRecap(rRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados auxiliares:", error);
    }
  };

  const openModal = (mode: 'create' | 'edit', servico?: Servico) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && servico) {
      setCurrentId(servico.id);
      setFormData({
        codigo: servico.codigo || '',
        descricao: servico.descricao || '',
        id_medida: (servico.id_medida || servico.medida?.id)?.toString() || '',
        id_desenho: (servico.id_desenho || servico.desenho?.id)?.toString() || '',
        id_produto: (servico.id_produto || servico.produto?.id)?.toString() || '',
        id_recap: (servico.id_recap || servico.recap?.id)?.toString() || '',
        valor: servico.valor || 0,
        ativo: servico.ativo,
        grupo: servico.grupo || ''
      });
      setProdutoSearchQuery(servico.produto?.descricao || '');
    } else {
      setCurrentId(null);
      setFormData({
        codigo: '',
        descricao: '',
        id_medida: '',
        id_desenho: '',
        id_produto: '',
        id_recap: '',
        valor: 0,
        ativo: true,
        grupo: ''
      });
      setProdutoSearchQuery('');
    }
    setShowProdutoSuggestions(false);
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectProduto = (p: Produto) => {
    setFormData(prev => ({ 
      ...prev, 
      id_produto: p.id,
      codigo: p.codprod || prev.codigo,
      descricao: p.descricao || prev.descricao
    }));
    setProdutoSearchQuery(p.descricao);
    setShowProdutoSuggestions(false);
  };

  const filteredProdutos = produtos.filter(p =>
    p.descricao.toLowerCase().includes(produtoSearchQuery.toLowerCase())
  ).slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao.trim()) {
      setFormError('A descrição do serviço é obrigatória.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    const payload = {
      ...formData,
      id_medida: formData.id_medida === '' ? null : Number(formData.id_medida),
      id_desenho: formData.id_desenho === '' ? null : Number(formData.id_desenho),
      id_produto: formData.id_produto === '' ? null : Number(formData.id_produto),
      id_recap: formData.id_recap === '' ? null : Number(formData.id_recap),
      valor: formData.valor === '' ? 0 : Number(formData.valor)
    };

    try {
      if (modalMode === 'create') {
        await api.post('/servicos/', payload);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/servicos/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar serviço.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o serviço "${descricao}"?`)) {
      try {
        await api.delete(`/servicos/${id}`);
        await fetchData();
      } catch (error) {
        alert('Erro ao excluir o serviço.');
      }
    }
  };

  return (
    <div className="servicos-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Catálogo Técnico de Serviços</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Serviços</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => window.print()}>
            <Printer size={20} /> Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} /> Novo Serviço
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por descrição, código, medida ou produto..."
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
                  <th style={{ width: '100px' }}>Código</th>
                  <th>Serviço / Medida</th>
                  <th>Produto / Desenho</th>
                  <th>T. Recap</th>
                  <th style={{ width: '100px' }}>Valor</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredServicos.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">Nenhum serviço encontrado.</td></tr>
                ) : (
                  filteredServicos.map(s => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td><strong>{s.codigo || '-'}</strong></td>
                      <td>
                        <div className="servico-info">
                          <span className="servico-desc">{s.descricao}</span>
                          {s.medida && <span className="servico-sub">Medida: {s.medida.descricao}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="servico-info">
                          <span>{s.produto?.descricao || '-'}</span>
                          {s.desenho && <span className="servico-sub">{s.desenho.descricao}</span>}
                        </div>
                      </td>
                      <td>{s.recap?.descricao || '-'}</td>
                      <td><strong>R$ {(s.valor || 0).toFixed(2)}</strong></td>
                      <td>
                        <span className={`status-badge ${s.ativo ? 'active' : 'inactive'}`}>
                          {s.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', s)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(s.id, s.descricao)}><Trash2 size={16} /></button>
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
          <div className="premium-modal-content large" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Serviço' : 'Editar Serviço'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem', minHeight: '400px' }}>
                {formError && <div className="form-error full-width">{formError}</div>}

                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <div className="grid-code-desc" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label htmlFor="codigo" style={{ fontWeight: '600', color: '#475569' }}>Código</label>
                      <input className="form-input" id="codigo" value={formData.codigo} onChange={handleChange} placeholder="---" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="descricao" style={{ fontWeight: '600', color: '#475569' }}>Descrição *</label>
                      <input className="form-input" id="descricao" value={formData.descricao} onChange={handleChange} placeholder="Gerada automaticamente..." required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                    <div className="form-group">
                      <label htmlFor="id_medida">Medida</label>
                      <select className="form-select" id="id_medida" value={formData.id_medida} onChange={handleChange}>
                        <option value="">Selecione a Medida</option>
                        {medidas.map(m => <option key={m.id} value={m.id.toString()}>{m.descricao}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="id_desenho">Desenho</label>
                      <select className="form-select" id="id_desenho" value={formData.id_desenho} onChange={handleChange}>
                        <option value="">Selecione o Desenho</option>
                        {desenhos.map(d => <option key={d.id} value={d.id.toString()}>{d.descricao}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="id_recap">Tipo de Recapagem</label>
                      <select className="form-select" id="id_recap" value={formData.id_recap} onChange={handleChange}>
                        <option value="">Selecione o Tipo</option>
                        {tiposRecap.map(r => <option key={r.id} value={r.id.toString()}>{r.descricao}</option>)}
                      </select>
                    </div>

                    {/* Produto com busca autocomplete */}
                    <div className="form-group" ref={produtoRef} style={{ position: 'relative' }}>
                      <label style={{ fontWeight: '600', color: '#475569' }}>Produto</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar produto..."
                        value={produtoSearchQuery}
                        onChange={(e) => {
                          setProdutoSearchQuery(e.target.value);
                          setShowProdutoSuggestions(true);
                          if (formData.id_produto) setFormData(prev => ({ ...prev, id_produto: '' }));
                        }}
                        onFocus={() => setShowProdutoSuggestions(true)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                      {showProdutoSuggestions && produtoSearchQuery.length > 0 && (
                        <div className="autocomplete-dropdown glass-panel" style={{ zIndex: 4000, position: 'absolute', width: '100%', backgroundColor: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredProdutos.length === 0 ? (
                            <div className="autocomplete-item empty" style={{ padding: '0.75rem', color: '#64748b' }}>Nenhum produto encontrado</div>
                          ) : (
                            filteredProdutos.map(p => (
                              <div
                                key={p.id}
                                className="autocomplete-item"
                                onClick={() => handleSelectProduto(p)}
                                style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <span className="name" style={{ color: '#1e293b', fontWeight: '500' }}>{p.descricao}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}>Grupo de Serviço</label>
                      <select 
                        className="form-input" 
                        id="grupo" 
                        value={formData.grupo} 
                        onChange={(e) => setFormData({...formData, grupo: e.target.value})}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                      >
                        <option value="">Selecione um grupo...</option>
                        <option value="RECAPAGEM">RECAPAGEM</option>
                        <option value="MANCHOES">MANCHOES</option>
                        <option value="PROTETORES">PROTETORES</option>
                        <option value="LONAS">LONAS</option>
                        <option value="CONSERTO">CONSERTO</option>
                        <option value="PATIO">PATIO</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}>Valor (R$)</label>
                      <input type="number" step="0.01" className="form-input" id="valor" value={formData.valor} onChange={handleMasterChange} placeholder="0.00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                      <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                        <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Serviço ativo para novas ordens</label>
                      </div>
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
