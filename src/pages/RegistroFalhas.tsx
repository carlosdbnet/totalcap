import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Loader2, Save, Trash2, X, AlertCircle, Edit2, Search } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';

interface RegistroFalha {
  id: number;
  data: string;
  id_setor: number;
  id_operador: number;
  id_falha: number;
  id_pneu?: number;
  obs: string;
  setor_nome: string;
  operador_nome: string;
  falha_nome: string;
}

export default function RegistroFalhas() {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<RegistroFalha[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Lookups
  const [setores, setSetores] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [tiposFalha, setTiposFalha] = useState<any[]>([]);
  
  // Form state
  const [idSetor, setIdSetor] = useState('');
  const [idOperador, setIdOperador] = useState('');
  const [idFalha, setIdFalha] = useState('');
  const [idPneu, setIdPneu] = useState('');
  const [pneuInfo, setPneuInfo] = useState<any>(null);
  const [searchingPneu, setSearchingPneu] = useState(false);
  const [obs, setObs] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLookups();
    fetchRegistros();
  }, []);

  const fetchLookups = async () => {
    // Carrega cada lookup individualmente para não travar tudo se um falhar
    try {
      const sRes = await api.get('/setores/');
      console.log('Setores carregados:', sRes.data?.length);
      setSetores(sRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar setores:", err);
    }

    try {
      const oRes = await api.get('/operadores/');
      console.log('Operadores carregados:', oRes.data?.length);
      setOperadores(oRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar operadores:", err);
    }

    try {
      const fRes = await api.get('/falhas/tipofalhas/');
      console.log('Tipos de falha carregados:', fRes.data?.length);
      setTiposFalha(fRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar tipos de falha:", err);
    }
  };

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const response = await api.get('/falhas/registrofalha/');
      setRegistros(response.data);
    } catch (err) {
      console.error("Erro ao buscar registros:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePneuSearch = async () => {
    if (!idPneu) return;
    setSearchingPneu(true);
    setPneuInfo(null);
    try {
      const response = await api.get(`/localizacao/pneu/${idPneu}`);
      if (response.data) {
        setPneuInfo(response.data);
      } else {
        setPneuInfo(null);
        alert('Pneu não encontrado.');
      }
    } catch (err) {
      console.error("Erro ao buscar pneu:", err);
      setPneuInfo(null);
      alert('Pneu não encontrado.');
    } finally {
      setSearchingPneu(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', registro?: RegistroFalha) => {
    setModalMode(mode);
    setFormError('');
    setPneuInfo(null);
    if (mode === 'edit' && registro) {
      setCurrentId(registro.id);
      setIdSetor(registro.id_setor?.toString() || '');
      setIdOperador(registro.id_operador?.toString() || '');
      setIdFalha(registro.id_falha?.toString() || '');
      setIdPneu(registro.id_pneu?.toString() || '');
      setObs(registro.obs || '');
      if (registro.id_pneu) {
        // Busca info do pneu para exibição
        api.get(`/localizacao/pneu/${registro.id_pneu}`).then(res => {
          setPneuInfo(res.data);
        }).catch(() => {});
      }
    } else {
      setCurrentId(null);
      setIdSetor('');
      setIdOperador('');
      setIdFalha('');
      setIdPneu('');
      setObs('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSetor || !idOperador || !idFalha) {
      setFormError("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        id_setor: parseInt(idSetor),
        id_operador: parseInt(idOperador),
        id_falha: parseInt(idFalha),
        id_pneu: idPneu ? parseInt(idPneu) : null,
        obs: obs
      };

      if (modalMode === 'create') {
        await api.post('/falhas/registrofalha/', payload);
      } else {
        await api.put(`/falhas/registrofalha/${currentId}`, payload);
      }
      
      setShowModal(false);
      fetchRegistros();
    } catch (err: any) {
      setFormError(getErrorMessage(err, "Erro ao salvar registro de falha."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await api.delete(`/falhas/registrofalha/${id}`);
      fetchRegistros();
    } catch (err) {
      alert("Erro ao excluir registro.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title-group">
          <AlertTriangle className="header-icon" style={{ color: '#ef4444' }} />
          <div>
            <h1>Registro de Falhas</h1>
            <p>Controle de interrupções e problemas técnicos na produção</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => openModal('create')} style={{ background: '#ef4444' }}>
          <Plus size={20} /> Novo Registro
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Setor</th>
              <th>Operador</th>
              <th>Tipo de Falha</th>
              <th>Observação</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}><Loader2 className="spinning" /> Carregando...</td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Nenhum registro de falha.</td></tr>
            ) : (
              registros.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.data).toLocaleString('pt-BR')}</td>
                  <td>{r.setor_nome}</td>
                  <td>{r.operador_nome}</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>{r.falha_nome}</td>
                  <td>{r.obs}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={() => openModal('edit', r)} title="Editar">
                        <Edit2 size={16} style={{ color: '#64748b' }} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(r.id)} title="Excluir">
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="premium-modal-content" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Registro de Falha' : 'Editar Registro de Falha'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error"><AlertCircle size={16} /> {formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px' }}>
                  
                  {/* ID PNEU - PRIMEIRO CAMPO */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}>ID Pneu</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={idPneu} 
                        onChange={e => { setIdPneu(e.target.value); setPneuInfo(null); }}
                        placeholder="Digite o ID do Pneu"
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={handlePneuSearch}
                        disabled={searchingPneu || !idPneu}
                        style={{ padding: '0 1rem', background: '#3b82f6' }}
                      >
                        {searchingPneu ? <Loader2 className="spinning" size={16} /> : <Search size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* DADOS DO PNEU */}
                  {pneuInfo && (
                    <div style={{ 
                      marginBottom: '1rem', 
                      padding: '1rem', 
                      background: '#f0fdf4', 
                      borderRadius: '8px', 
                      border: '1px solid #bbf7d0',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '0.5rem' }}>
                        Pneu #{pneuInfo.id} — OS: {pneuInfo.numos}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                        <div><strong>Cliente:</strong> {pneuInfo.cliente}</div>
                        <div><strong>Medida:</strong> {pneuInfo.medida}</div>
                        <div><strong>DOT:</strong> {pneuInfo.dot || '-'}</div>
                        <div><strong>Série:</strong> {pneuInfo.numserie || '-'}</div>
                        <div><strong>Nº Fogo:</strong> {pneuInfo.numfogo || '-'}</div>
                        <div><strong>Marca:</strong> {pneuInfo.marca || '-'}</div>
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}>Setor *</label>
                    <select className="form-select" value={idSetor} onChange={e => setIdSetor(e.target.value)} required>
                      <option value="">Selecione o Setor</option>
                      {setores.map(s => <option key={s.id} value={s.id}>{s.descricao}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}>Operador *</label>
                    <select className="form-select" value={idOperador} onChange={e => setIdOperador(e.target.value)} required>
                      <option value="">Selecione o Operador</option>
                      {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}>Tipo de Falha *</label>
                    <select className="form-select" value={idFalha} onChange={e => setIdFalha(e.target.value)} required>
                      <option value="">Selecione a Falha</option>
                      {tiposFalha.map(f => <option key={f.id} value={f.id}>{f.descricao}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label style={{ fontWeight: '600', color: '#475569' }}>Observação</label>
                    <textarea className="form-input" value={obs} onChange={e => setObs(e.target.value)} rows={3} placeholder="Descrição do problema..." />
                  </div>
                </div>
              </div>
              
              <div className="premium-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: '#ef4444' }}>
                  {isSubmitting ? <Loader2 className="spinning" size={20} /> : <Save size={20} />}
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