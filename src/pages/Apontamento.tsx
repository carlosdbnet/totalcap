import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Search, Edit2, Trash2, X, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Apontamento.css';

interface ApontamentoRecord {
  id: number;
  id_pneu: number;
  id_setor: number | null;
  id_operador: number | null;
  inicio: string | null;
  termino: string | null;
  tempo: number | null;
  obs: string | null;
  status: string | null;
  codbarra: string | null;
  datalan: string;
  desc_setor?: string;
  nome_operador?: string;
}

interface LookupItem {
  id: number;
  nome?: string;
  descricao?: string;
}

interface PneuInfo {
  id: number;
  numserie: string;
  numfogo: string;
  numos: number;
  cliente: string;
  medida: string;
  desenho: string;
}

export default function Apontamento() {
  const [apontamentos, setApontamentos] = useState<ApontamentoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lookups
  const [setores, setSetores] = useState<LookupItem[]>([]);
  const [operadores, setOperadores] = useState<LookupItem[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    codbarra: '',
    id_pneu: 0,
    id_setor: 0,
    id_operador: 0,
    inicio: '',
    termino: '',
    tempo: 0,
    obs: '',
    status: 'F'
  });
  
  const [pneuInfo, setPneuInfo] = useState<PneuInfo | null>(null);
  const [searchingPneu, setSearchingPneu] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/apontamentos/');
      setApontamentos(response.data);
    } catch (error) {
      console.error("Erro ao buscar apontamentos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLookups = async () => {
    try {
      const [sRes, oRes] = await Promise.all([
        api.get('/setores/'),
        api.get('/operadores/')
      ]);
      setSetores(sRes.data);
      setOperadores(oRes.data);
    } catch (error) {
      console.error("Erro ao buscar lookups:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, [fetchData]);

  const handleBarcodeSearch = async () => {
    if (!formData.codbarra.trim()) return;
    
    setSearchingPneu(true);
    setFormError('');
    try {
      const response = await api.get(`/apontamentos/pneu-by-barcode/${formData.codbarra}`);
      if (response.data.error) {
        setFormError(String(response.data.error));
        setPneuInfo(null);
        setFormData(prev => ({ ...prev, id_pneu: 0 }));
      } else {
        setPneuInfo(response.data);
        setFormData(prev => ({ ...prev, id_pneu: response.data.id }));
      }
    } catch (error) {
      setFormError("Erro ao localizar pneu.");
    } finally {
      setSearchingPneu(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', record?: ApontamentoRecord) => {
    setModalMode(mode);
    setFormError('');
    setPneuInfo(null);
    
    if (mode === 'edit' && record) {
      setCurrentId(record.id);
      setFormData({
        codbarra: record.codbarra || '',
        id_pneu: record.id_pneu,
        id_setor: record.id_setor || 0,
        id_operador: record.id_operador || 0,
        inicio: record.inicio ? record.inicio.substring(0, 16) : '',
        termino: record.termino ? record.termino.substring(0, 16) : '',
        tempo: record.tempo || 0,
        obs: record.obs || '',
        status: record.status || 'F'
      });
      // Em edição, o codbarra já existe, então buscamos a info do pneu
      if (record.codbarra) {
        // Simular a busca do pneu para preencher o card de info
        api.get(`/apontamentos/pneu-by-barcode/${record.codbarra}`).then(res => {
          if (!res.data.error) setPneuInfo(res.data);
        });
      }
    } else {
      setCurrentId(null);
      setFormData({
        codbarra: '',
        id_pneu: 0,
        id_setor: 0,
        id_operador: 0,
        inicio: new Date().toISOString().substring(0, 16),
        termino: '',
        tempo: 0,
        obs: '',
        status: 'F'
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id_pneu === 0) {
      setFormError('É necessário localizar um pneu válido pelo código de barras.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload = {
      ...formData,
      id_setor: formData.id_setor || null,
      id_operador: formData.id_operador || null,
      inicio: formData.inicio || null,
      termino: formData.termino || null,
      tempo: formData.tempo ? Number(formData.tempo) : 0
    };

    try {
      if (modalMode === 'create') {
        await api.post('/apontamentos/', payload);
      } else {
        await api.put(`/apontamentos/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar apontamento.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir este apontamento?')) {
      try {
        await api.delete(`/apontamentos/${id}`);
        await fetchData();
      } catch (error) {
        alert('Erro ao excluir.');
      }
    }
  };

  const filteredData = apontamentos.filter(a => 
    a.codbarra?.includes(searchTerm) || 
    a.nome_operador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.desc_setor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="apontamento-container">
      <div className="page-header">
        <h1 className="title"><Clock /> Apontamento de Produção</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} /> Novo Apontamento
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por código, setor ou operador..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="data-table-wrapper">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className="spinning" size={32} />
              <p style={{ marginTop: '1rem' }}>Carregando produção...</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Cód. Barras</th>
                  <th>Setor</th>
                  <th>Operador</th>
                  <th>Início</th>
                  <th>Término</th>
                  <th>Tempo</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum registro encontrado.</td></tr>
                ) : (
                  currentItems.map(a => (
                    <tr key={a.id}>
                      <td>{new Date(a.datalan).toLocaleString('pt-BR')}</td>
                      <td><strong>{a.codbarra || '-'}</strong></td>
                      <td>{a.desc_setor || '-'}</td>
                      <td>{a.nome_operador || '-'}</td>
                      <td>{a.inicio ? new Date(a.inicio).toLocaleTimeString('pt-BR') : '-'}</td>
                      <td>{a.termino ? new Date(a.termino).toLocaleTimeString('pt-BR') : '-'}</td>
                      <td>{a.tempo ? `${a.tempo} min` : '-'}</td>
                      <td>
                        <span className={`status-badge ${a.status}`}>
                          {a.status === 'F' ? 'Finalizado' : a.status === 'P' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', a)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(a.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredData.length > itemsPerPage && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a <strong>{Math.min(indexOfLastItem, filteredData.length)}</strong> de <strong>{filteredData.length}</strong> registros
            </div>
            <div className="pagination-controls">
              <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Anterior</button>
              <div style={{ padding: '0 1rem', fontWeight: 'bold' }}>Página {currentPage} de {totalPages}</div>
              <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Próximo</button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="premium-modal-content" style={{ maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Apontamento' : 'Editar Apontamento'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                {formError && <div className="form-error"><AlertCircle size={16} /> {formError}</div>}
                
                <div className="premium-master-panel">
                  <div className="premium-section-title"><Clock size={16} /> Dados do Apontamento</div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Código de Barras / Nº Fogo *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        className="form-input" 
                        id="codbarra" 
                        style={{ flex: 1 }}
                        value={formData.codbarra} 
                        onChange={handleChange} 
                        onBlur={handleBarcodeSearch}
                        placeholder="Bipe ou digite o código..."
                        required 
                      />
                      <button type="button" className="btn-search-premium" onClick={handleBarcodeSearch} disabled={searchingPneu}>
                        {searchingPneu ? <Loader2 className="spinning" size={18} /> : <Search size={18} />}
                      </button>
                    </div>
                  </div>

                  {pneuInfo && (
                    <div className="pneu-info-card" style={{ marginBottom: '1rem' }}>
                      <div className="pneu-info-title">Pneu Identificado</div>
                      <div className="pneu-info-content">{pneuInfo.medida} - {pneuInfo.desenho}</div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Série: {pneuInfo.numserie} | Fogo: {pneuInfo.numfogo}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>OS: #{pneuInfo.numos} | Cliente: {pneuInfo.cliente}</div>
                    </div>
                  )}

                  <div className="grid-2">
                    <div className="form-group">
                      <label>Setor</label>
                      <select className="form-select" id="id_setor" value={formData.id_setor} onChange={handleChange}>
                        <option value={0}>Selecione...</option>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.descricao}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Operador</label>
                      <select className="form-select" id="id_operador" value={formData.id_operador} onChange={handleChange}>
                        <option value={0}>Selecione...</option>
                        {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="premium-master-panel">
                  <div className="premium-section-title"><Play size={16} /> Tempos e Status</div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Início</label>
                      <input type="datetime-local" className="form-input" id="inicio" value={formData.inicio} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Término</label>
                      <input type="datetime-local" className="form-input" id="termino" value={formData.termino} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid-2" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Tempo (Minutos)</label>
                      <input type="number" className="form-input" id="tempo" value={formData.tempo} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select className="form-select" id="status" value={formData.status} onChange={handleChange}>
                        <option value="P">Pendente</option>
                        <option value="F">Finalizado</option>
                        <option value="C">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Observações</label>
                  <textarea className="form-input" id="obs" value={formData.obs} onChange={handleChange} rows={2} />
                </div>
              </div>
              
              <div className="premium-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || searchingPneu}>
                  {isSubmitting ? <Loader2 className="spinning" size={18} /> : (modalMode === 'create' ? <Play size={18} /> : <CheckCircle2 size={18} />)}
                  {modalMode === 'create' ? 'Iniciar/Gravar' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
