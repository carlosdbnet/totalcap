import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Calendar, User, Factory, Loader2, Save, Package, X, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';

interface ConsumoItem {
  id: number;
  data: string;
  id_produto?: number;
  id_setor?: number;
  id_operador?: number;
  produto_nome: string;
  quant: number;
  unidade: string;
  setor_nome: string;
  operador_nome: string;
}

export default function ConsumoMateriaPrima() {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<ConsumoItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [datamov, setDatamov] = useState('');
  const [idProduto, setIdProduto] = useState('');
  const [idSetor, setIdSetor] = useState('');
  const [idOperador, setIdOperador] = useState('');
  const [quant, setQuant] = useState('');
  const [obs, setObs] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Lookups
  const [produtos, setProdutos] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);

  useEffect(() => {
    fetchLookups();
    fetchRegistros();
  }, []);

  const fetchLookups = async () => {
    try {
      const [pRes, sRes, oRes] = await Promise.all([
        api.get('/produtos/'),
        api.get('/setores/'),
        api.get('/operadores/')
      ]);
      setProdutos(pRes.data);
      setSetores(sRes.data);
      setOperadores(oRes.data);
    } catch (err) {
      console.error("Erro ao carregar lookups:", err);
    }
  };

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const response = await api.get('/consumo-materia/relatorio');
      setRegistros(response.data);
    } catch (err) {
      console.error("Erro ao buscar registros:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', registro?: ConsumoItem) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && registro) {
      setCurrentId(registro.id);
      setDatamov(registro.data ? registro.data.split('T')[0] : '');
      setIdProduto(registro.id_produto?.toString() || '');
      setIdSetor(registro.id_setor?.toString() || '');
      setIdOperador(registro.id_operador?.toString() || '');
      setQuant(registro.quant?.toString() || '');
      setObs(registro.obs || '');
    } else {
      setCurrentId(null);
      setDatamov(new Date().toISOString().split('T')[0]);
      setIdProduto('');
      setIdSetor('');
      setIdOperador('');
      setQuant('');
      setObs('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProduto || !quant) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const payload: any = {
        id_produto: parseInt(idProduto),
        quant: parseFloat(quant)
      };
      
      if (idSetor) payload.id_setor = parseInt(idSetor);
      if (idOperador) payload.id_operador = parseInt(idOperador);
      if (obs) payload.obs = obs;
      if (datamov) payload.datamov = datamov;

      if (modalMode === 'create') {
        await api.post('/consumo-materia/', payload);
      } else {
        await api.put(`/consumo-materia/${currentId}/`, payload);
      }
      
      setShowModal(false);
      resetForm();
      fetchRegistros();
    } catch (err: any) {
      setFormError(getErrorMessage(err, "Erro ao salvar lançamento de consumo."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      await api.delete(`/consumo-materia/${id}`);
      fetchRegistros();
    } catch (err) {
      alert("Erro ao excluir registro.");
    }
  };

  const resetForm = () => {
    setDatamov('');
    setIdProduto('');
    setIdSetor('');
    setIdOperador('');
    setQuant('');
    setObs('');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title-group">
          <Layers className="header-icon" style={{ color: '#f59e0b' }} />
          <div>
            <h1>Consumo de Mat.Prima</h1>
            <p>Lançamento de utilização de insumos e matérias-primas</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => openModal('create')} style={{ background: '#f59e0b' }}>
          <Plus size={20} /> Novo Lançamento
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Produto/Insumo</th>
              <th style={{ textAlign: 'right' }}>Quantidade</th>
              <th>Setor</th>
              <th>Operador</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}><Loader2 className="spinning" /> Carregando...</td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Nenhum lançamento encontrado.</td></tr>
            ) : (
              registros.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.data).toLocaleString('pt-BR')}</td>
                  <td style={{ fontWeight: 600 }}>{r.produto_nome}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.quant.toFixed(3)}</td>
                  <td>{r.setor_nome}</td>
                  <td>{r.operador_nome}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-icon-premium" 
                        onClick={() => openModal('edit', r)}
                        style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon-premium" 
                        onClick={() => handleDelete(r.id)}
                        style={{ background: '#ef4444', color: 'white', padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="premium-modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Lançamento de Consumo' : 'Editar Lançamento'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error"><AlertCircle size={16} /> {formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}>Data do Movimento</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={datamov} 
                      onChange={e => setDatamov(e.target.value)} 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}>Produto/Insumo *</label>
                    <select className="form-select" value={idProduto} onChange={e => setIdProduto(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <option value="">Selecione o Insumo</option>
                      {produtos.map(p => <option key={p.id} value={p.id}>{p.descricao} ({p.unidade})</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}>Quantidade *</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="form-input"
                      value={quant} 
                      onChange={e => setQuant(e.target.value)} 
                      placeholder="0.000"
                      required 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  
                  <div className="grid-2" style={{ marginBottom: '1.2rem' }}>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}>Setor</label>
                      <select className="form-select" value={idSetor} onChange={e => setIdSetor(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="">Selecione o Setor</option>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.descricao}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#475569' }}>Operador</label>
                      <select className="form-select" value={idOperador} onChange={e => setIdOperador(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="">Selecione o Operador</option>
                        {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label style={{ fontWeight: '600', color: '#475569' }}>Observação</label>
                    <textarea 
                      className="form-input"
                      value={obs} 
                      onChange={e => setObs(e.target.value)}
                      placeholder="Notas sobre o consumo..."
                      rows={2}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="premium-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: '#f59e0b' }}>
                  {isSubmitting ? <Loader2 className="spinning" size={20} /> : <Save size={20} />}
                  Salvar Consumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
