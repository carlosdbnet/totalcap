import React, { useState, useEffect, useRef } from 'react';
import api, { getErrorMessage } from '../lib/api';
import { Plus, Search, Edit2, Trash2, X, Save, Eye, Printer, FileText, User, Calendar, CheckCircle, AlertTriangle, Hash, DollarSign, Settings, Truck, Clipboard, Activity, AlertCircle, Loader2 } from 'lucide-react';
import LaudoPrintView from '../components/LaudoPrintView';
import '../components/LaudoPrintView.css';
import LaudoGarantiaPrintView from '../components/LaudoGarantiaPrintView';
import type { Laudo } from '../types/laudo';

export default function Laudos() {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [tiporecaps, setTiporecaps] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);
  const [desenhos, setDesenhos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [selectedLaudosForPrint, setSelectedLaudosForPrint] = useState<Laudo[]>([]);
  const [printMode, setPrintMode] = useState<'solicitacao' | 'garantia'>('solicitacao');
  const [selectedLaudos, setSelectedLaudos] = useState<number[]>([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const placaRef = useRef<HTMLInputElement>(null);

  const handlePneuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      placaRef.current?.focus();
    }
  };
  const [formData, setFormData] = useState<Laudo>({
    id_pneu: '',
    id_contato: 0,
    id_medida: 0,
    id_desenho: 0,
    id_recap: 0,
    numlaudo: 0,
    datasol: new Date().toISOString().split('T')[0],
    numos: 0,
    vrservico: 0,
    qreforma: 0,
    percdesg: 0,
    percrepo: 0,
    percrefor: 0,
    vrcredito: 0,
    vrpago: 0,
    vrsaldo: 0,
    vrestornocomissao: 0,
    qremanescente: 0,
    laudofab: 0,
    numnota: 0,
    status: 'A'
  });

  useEffect(() => {
    fetchData();
    fetchTiporecaps();
    fetchMedidas();
    fetchDesenhos();
    fetchClientes();
    fetchEmpresas();
    fetchServicos();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/laudos');
      setLaudos(response.data);
    } catch (error) {
      console.error("Erro ao buscar laudos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiporecaps = async () => {
    try {
      const response = await api.get('/tipo-recapagem');
      setTiporecaps(response.data);
    } catch (error) {
      console.error("Erro ao buscar tipos de recapagem:", error);
    }
  };

  const fetchMedidas = async () => {
    try {
      const response = await api.get('/medidas');
      setMedidas(response.data);
    } catch (error) {
      console.error("Erro ao buscar medidas:", error);
    }
  };

  const fetchDesenhos = async () => {
    try {
      const response = await api.get('/desenhos');
      setDesenhos(response.data);
    } catch (error) {
      console.error("Erro ao buscar desenhos:", error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const response = await api.get('/empresas');
      setEmpresas(response.data);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    }
  };

  const fetchServicos = async () => {
    try {
      const response = await api.get('/servicos');
      setServicos(response.data);
    } catch (error) {
      console.error("Erro ao buscar servicos:", error);
    }
  };

  const handlePrintSolicitacao = (laudo: Laudo) => {
    setPrintMode('solicitacao');
    setSelectedLaudosForPrint([laudo]);
    setTimeout(() => {
      window.print();
      setSelectedLaudosForPrint([]);
    }, 300);
  };

  const handlePrintLaudoGarantia = (laudo: Laudo) => {
    setPrintMode('garantia');
    setSelectedLaudosForPrint([laudo]);
    setTimeout(() => {
      window.print();
      setSelectedLaudosForPrint([]);
    }, 300);
  };

  const handleBatchPrintSolicitacao = () => {
    const toPrint = laudos.filter(l => l.id && selectedLaudos.includes(l.id));
    if (toPrint.length === 0) return;
    setPrintMode('solicitacao');
    setSelectedLaudosForPrint(toPrint);
    setTimeout(() => {
      window.print();
      setSelectedLaudosForPrint([]);
    }, 300);
  };

  const handleBatchPrintGarantia = () => {
    const toPrint = laudos.filter(l => l.id && selectedLaudos.includes(l.id));
    if (toPrint.length === 0) return;
    setPrintMode('garantia');
    setSelectedLaudosForPrint(toPrint);
    setTimeout(() => {
      window.print();
      setSelectedLaudosForPrint([]);
    }, 300);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', laudo?: Laudo) => {
    setModalMode(mode);
    if ((mode === 'edit' || mode === 'view') && laudo) {
      setCurrentId(laudo.id!);
      const formattedLaudo = { ...laudo };
      const dateFields = ['datasol', 'dataprod', 'dataexa', 'datarep', 'datafat', 'dataresul'];
      dateFields.forEach(field => {
        if (formattedLaudo[field as keyof Laudo]) {
          formattedLaudo[field as keyof Laudo] = (formattedLaudo[field as keyof Laudo] as string).split('T')[0] as any;
        }
      });
      setFormData(formattedLaudo);
    } else {
      setCurrentId(null);
      setFormData({
        id_pneu: '',
        id_contato: 0,
        id_medida: 0,
        id_desenho: 0,
        id_recap: 0,
        numlaudo: 0,
        datasol: new Date().toISOString().split('T')[0],
        numos: 0,
        cpfcnpj: '',
        codreg: '',
        codven: '',
        codservico: '',
        medida: '',
        desenho: '',
        codserv: '',
        marca: '',
        dot: '',
        numserie: '',
        numfogo: '',
        desenhoriginal: '',
        vrservico: 0,
        borracha: '',
        carcaca: '',
        qreforma: 0,
        placa: '',
        uso: '',
        garantia: '',
        codresp: '',
        estado: '',
        defeito: '',
        causa: '',
        respgara: '',
        laudo: '',
        motivo: '',
        tiporepo: '',
        percdesg: 0,
        percrepo: 0,
        percrefor: 0,
        servrepo: '',
        vrcredito: 0,
        vrpago: 0,
        vrsaldo: 0,
        vrestornocomissao: 0,
        notarep: 0,
        statrep: '',
        qremanescente: 0,
        alegacao: '',
        examinador: '',
        laudofab: 0,
        profundidade: 0,
        serienf: '',
        numnota: 0,
        pcomserv: 0,
        obs: '',
        obs2: '',
        status: 'A'
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Laudo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePneuBlur = async () => {
    const searchTerm = String(formData.id_pneu || '').trim();
    if (!searchTerm || searchTerm === '0') return;

    try {
      console.log(`Buscando pneu com termo: "${searchTerm}"`);
      const response = await api.get(`/ordens-servico/pneu-completo/${encodeURIComponent(searchTerm)}`);
      if (response.data) {
        const pneuData = response.data;
        setFormData(prev => ({
          ...prev,
          id_pneu: pneuData.id,
          id_contato: pneuData.id_contato,
          id_medida: pneuData.id_medida,
          id_desenho: pneuData.id_desenho,
          id_recap: pneuData.id_recap,
          numos: pneuData.numos,
          medida: pneuData.medida,
          marca: pneuData.marca,
          desenho: pneuData.desenho,
          codservico: pneuData.codservico,
          numserie: pneuData.numserie,
          numfogo: pneuData.numfogo,
          dot: pneuData.dot,
          desenhoriginal: pneuData.desenhoriginal,
          vrservico: pneuData.vrservico,
          qreforma: pneuData.qreforma,
          cpfcnpj: pneuData.cpfcnpj,
          placa: pneuData.placa,
          id_empresa: pneuData.id_empresa
        }));
      }
    } catch (error: any) {
      console.error("Erro ao buscar detalhes do pneu:", error);
      const status = error.response?.status;
      const detail = error.response?.data?.detail || "Erro na busca.";
      alert(`Erro ${status}: ${detail}`);
      // Limpa campos se não encontrar para evitar dados inconsistentes
      setFormData(prev => ({
        ...prev,
        numos: 0,
        id_contato: 0,
        id_medida: 0,
        id_desenho: 0,
        id_recap: 0,
        medida: '',
        marca: '',
        desenho: '',
        codservico: '',
        numserie: '',
        numfogo: '',
        dot: '',
        desenhoriginal: '',
        vrservico: 0,
        qreforma: 0,
        cpfcnpj: '',
        placa: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      if (modalMode === 'create') {
        await api.post('/laudos/', formData);
      } else {
        await api.put(`/laudos/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, "Erro ao salvar laudo."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja excluir este laudo?")) {
      try {
        await api.delete(`/laudos/${id}`);
        fetchData();
      } catch (error) {
        console.error("Erro ao excluir laudo:", error);
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLaudos(laudos.map(l => l.id!));
    } else {
      setSelectedLaudos([]);
    }
  };

  const handleSelectLaudo = (id: number) => {
    setSelectedLaudos(prev => 
      prev.includes(id) ? prev.filter(laudoId => laudoId !== id) : [...prev, id]
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title-group">
          <FileText className="header-icon" />
          <div>
            <h1>Laudos Técnicos</h1>
            <p>Gerenciamento detalhado de laudos e garantias</p>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={handleBatchPrintSolicitacao}
            disabled={selectedLaudos.length === 0}
            style={{ background: '#3b82f6', color: 'white', border: 'none' }}
          >
            <Printer size={20} /> Solicitação Laudo
          </button>
          <button 
            className="btn-secondary" 
            onClick={handleBatchPrintGarantia}
            disabled={selectedLaudos.length === 0}
            style={{ background: '#f59e0b', color: 'white', border: 'none' }}
          >
            <FileText size={20} /> Laudo de Garantia
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} /> Novo Laudo
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={selectedLaudos.length > 0 && selectedLaudos.length === laudos.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Nº Laudo</th>
              <th>Data</th>
              <th>OS</th>
              <th>Pneu</th>
              <th style={{ textAlign: 'right' }}>Saldo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>Carregando...</td></tr>
            ) : laudos.length === 0 ? (
              <tr><td colSpan={8}>Nenhum laudo encontrado.</td></tr>
            ) : (
              laudos.map(l => (
                <tr key={l.id} className={selectedLaudos.includes(l.id!) ? 'selected-row' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedLaudos.includes(l.id!)}
                      onChange={() => handleSelectLaudo(l.id!)}
                    />
                  </td>
                  <td><span className="os-number">#{l.numlaudo}</span></td>
                  <td>{l.datasol ? new Date(l.datasol).toLocaleDateString() : '-'}</td>
                  <td>OS {l.numos}</td>
                  <td>ID {l.id_pneu}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>R$ {parseFloat(l.vrsaldo || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge status-${l.status === 'A' ? 'aberta' : 'cancelada'}`}>
                      {l.status === 'A' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="icon-btn info" 
                        onClick={() => handlePrintSolicitacao(l)} 
                        title="Solicitação" 
                        style={{ background: '#3b82f6' }}
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        className="icon-btn warning" 
                        onClick={() => handlePrintLaudoGarantia(l)} 
                        title="Laudo de Garantia" 
                        style={{ background: '#f59e0b' }}
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        className="icon-btn success" 
                        onClick={() => openModal('view', l)} 
                        title="Visualizar" 
                        style={{ background: '#10b981' }}
                      >
                        <Eye size={18} />
                      </button>
                      <button className="icon-btn edit" onClick={() => openModal('edit', l)} title="Editar"><Edit2 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(l.id!)} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="premium-modal-content" style={{ maxWidth: '1200px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="header-title-group">
                <Clipboard className="header-icon" />
                <h2>
                  {modalMode === 'create' ? 'Configurar Novo Laudo Técnico' : 
                   modalMode === 'view' ? `Visualizando Laudo #${formData.numlaudo}` :
                   `Editando Laudo #${formData.numlaudo}`}
                </h2>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable" style={{ background: '#E5E5E5', padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
                {formError && <div className="form-error"><AlertCircle size={16} /> {formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h3 className="section-subtitle"><Hash size={16} /> Identificação e Cabeçalho</h3>
                  <div className="grid-4" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Nº Laudo *</label>
                    <input type="number" className="form-input" value={formData.numlaudo} onChange={e => handleInputChange('numlaudo', parseInt(e.target.value))} required />
                  </div>
                  <div className="form-group">
                    <label>Data Solicitação</label>
                    <input type="date" className="form-input" value={formData.datasol} onChange={e => handleInputChange('datasol', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Nº OS *</label>
                    <input type="number" className="form-input" value={formData.numos} onChange={e => handleInputChange('numos', parseInt(e.target.value))} required />
                  </div>
                  <div className="form-group">
                    <label>ID Pneu *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder="ID, Série ou Fogo"
                        value={formData.id_pneu || ''}
                        onChange={e => handleInputChange('id_pneu', e.target.value)}
                        onBlur={handlePneuBlur}
                        onKeyDown={handlePneuKeyDown}
                        required
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handlePneuBlur}
                        title="Buscar dados do pneu"
                        style={{ padding: '0 0.8rem' }}
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-input" value={formData.status} onChange={e => handleInputChange('status', e.target.value)}>
                      <option value="A">Ativo</option>
                      <option value="C">Cancelado</option>
                      <option value="F">Finalizado</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Placa</label>
                    <input
                      ref={placaRef}
                      type="text"
                      className="form-input"
                      value={formData.placa}
                      onChange={e => handleInputChange('placa', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>CPF/CNPJ Cliente</label>
                    <input type="text" className="form-input" value={formData.cpfcnpj} onChange={e => handleInputChange('cpfcnpj', e.target.value)} />
                  </div>
                </div>
              </div>

                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h3 className="section-subtitle"><Activity size={16} /> Dados Técnicos do Pneu</h3>
                  <div className="grid-4" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Medida</label>
                    <select
                      className="form-input"
                      value={formData.id_medida}
                      onChange={e => handleInputChange('id_medida', parseInt(e.target.value))}
                    >
                      <option value={0}>Selecione...</option>
                      {medidas.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marca</label>
                    <input type="text" className="form-input" value={formData.marca} onChange={e => handleInputChange('marca', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Desenho</label>
                    <select
                      className="form-input"
                      value={formData.id_desenho}
                      onChange={e => handleInputChange('id_desenho', parseInt(e.target.value))}
                    >
                      <option value={0}>Selecione...</option>
                      {desenhos.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo Recapagem</label>
                    <select
                      className="form-input"
                      value={formData.id_recap}
                      onChange={e => handleInputChange('id_recap', parseInt(e.target.value))}
                    >
                      <option value={0}>Selecione...</option>
                      {tiporecaps.map(tr => (
                        <option key={tr.id} value={tr.id}>
                          {tr.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>DOT</label>
                    <input type="text" className="form-input" value={formData.dot} onChange={e => handleInputChange('dot', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Nº Série</label>
                    <input type="text" className="form-input" value={formData.numserie} onChange={e => handleInputChange('numserie', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Nº Fogo</label>
                    <input type="text" className="form-input" value={formData.numfogo} onChange={e => handleInputChange('numfogo', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Desenho Original</label>
                    <input type="text" className="form-input" value={formData.desenhoriginal} onChange={e => handleInputChange('desenhoriginal', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Profundidade (mm)</label>
                    <input type="number" step="0.01" className="form-input" value={formData.profundidade} onChange={e => handleInputChange('profundidade', parseFloat(e.target.value))} />
                  </div>
                  </div>
                </div>

                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h3 className="section-subtitle"><DollarSign size={16} /> Serviços e Valores</h3>
                  <div className="grid-4" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Valor Total</label>
                    <input type="number" step="0.01" className="form-input highlight-field" value={formData.vrservico} onChange={e => handleInputChange('vrservico', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Qtd. Reformas</label>
                    <input type="number" className="form-input" value={formData.qreforma} onChange={e => handleInputChange('qreforma', parseInt(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Cód. Serviço</label>
                    <input type="text" className="form-input" value={formData.codservico} onChange={e => handleInputChange('codservico', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Borracha</label>
                    <input type="text" className="form-input" value={formData.borracha} onChange={e => handleInputChange('borracha', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Carcaça</label>
                    <input type="text" className="form-input" value={formData.carcaca} onChange={e => handleInputChange('carcaca', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>% Comis. Serv.</label>
                    <input type="number" step="0.01" className="form-input" value={formData.pcomserv} onChange={e => handleInputChange('pcomserv', parseFloat(e.target.value))} />
                  </div>
                  </div>
                </div>

                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h3 className="section-subtitle"><Search size={16} /> Análise e Constatação</h3>
                  <div className="grid-4" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Defeito (Cód)</label>
                    <input type="text" className="form-input" value={formData.defeito} onChange={e => handleInputChange('defeito', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Causa (Cód)</label>
                    <input type="text" className="form-input" value={formData.causa} onChange={e => handleInputChange('causa', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Examinador</label>
                    <input type="text" className="form-input" value={formData.examinador} onChange={e => handleInputChange('examinador', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Data Exame</label>
                    <input type="date" className="form-input" value={formData.dataexa} onChange={e => handleInputChange('dataexa', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Resp. Garantia</label>
                    <input type="text" className="form-input" value={formData.respgara} onChange={e => handleInputChange('respgara', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Parecer (Laudo)</label>
                    <input type="text" className="form-input highlight-field" value={formData.laudo} onChange={e => handleInputChange('laudo', e.target.value)} placeholder="A/R/O" />
                  </div>
                  <div className="form-group">
                    <label>Motivo</label>
                    <input type="text" className="form-input" value={formData.motivo} onChange={e => handleInputChange('motivo', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>% Desgaste</label>
                    <input type="number" step="0.01" className="form-input" value={formData.percdesg} onChange={e => handleInputChange('percdesg', parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>

                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h3 className="section-subtitle"><Truck size={16} /> Reposição e Faturamento</h3>
                  <div className="grid-4" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Tipo Repos.</label>
                    <input type="text" className="form-input" value={formData.tiporepo} onChange={e => handleInputChange('tiporepo', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>% Repos.</label>
                    <input type="number" step="0.01" className="form-input" value={formData.percrepo} onChange={e => handleInputChange('percrepo', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Valor Repos.</label>
                    <input type="number" step="0.01" className="form-input" value={formData.vrcredito} onChange={e => handleInputChange('vrcredito', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Valor Pago</label>
                    <input type="number" step="0.01" className="form-input" value={formData.vrpago} onChange={e => handleInputChange('vrpago', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Saldo</label>
                    <input type="number" step="0.01" className="form-input" value={formData.vrsaldo} onChange={e => handleInputChange('vrsaldo', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Nº Nota Repos.</label>
                    <input type="number" className="form-input" value={formData.notarep} onChange={e => handleInputChange('notarep', parseInt(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Nº Nota Fiscal</label>
                    <input type="number" className="form-input" value={formData.numnota} onChange={e => handleInputChange('numnota', parseInt(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Data Faturamento</label>
                    <input type="date" className="form-input" value={formData.datafat} onChange={e => handleInputChange('datafat', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Série NF</label>
                    <input type="text" className="form-input" value={formData.serienf} onChange={e => handleInputChange('serienf', e.target.value)} />
                  </div>
                  </div>
                </div>

                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h3 className="section-subtitle"><Clipboard size={16} /> Alegação e Observações</h3>
                  <div className="grid-1" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Alegação do Cliente</label>
                    <textarea className="form-input" rows={2} value={formData.alegacao} onChange={e => handleInputChange('alegacao', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Observações Gerais</label>
                    <textarea className="form-input" rows={2} value={formData.obs} onChange={e => handleInputChange('obs', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Observações Adicionais</label>
                    <textarea className="form-input" rows={2} value={formData.obs2} onChange={e => handleInputChange('obs2', e.target.value)} />
                  </div>
                  </div>
                </div>
              </div>
              <div className="premium-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                </button>
                {modalMode !== 'view' && (
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="spinning" size={18} /> : <Save size={18} />}
                    Salvar Laudo Completo
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedLaudosForPrint.length > 0 && printMode === 'solicitacao' && (
        <div className="print-batch">
          {selectedLaudosForPrint.map((laudo, index) => (
            <div key={laudo.id} style={{ pageBreakAfter: index < selectedLaudosForPrint.length - 1 ? 'always' : 'auto' }}>
              <LaudoPrintView 
                data={laudo}
                medidas={medidas}
                desenhos={desenhos}
                tiporecaps={tiporecaps}
                clientes={clientes}
                empresas={empresas}
              />
            </div>
          ))}
        </div>
      )}

      {selectedLaudosForPrint.length > 0 && printMode === 'garantia' && (
        <div className="print-batch">
          {selectedLaudosForPrint.map((laudo, index) => (
            <div key={laudo.id} style={{ pageBreakAfter: index < selectedLaudosForPrint.length - 1 ? 'always' : 'auto' }}>
              <LaudoGarantiaPrintView 
                data={laudo}
                medidas={medidas}
                desenhos={desenhos}
                tiporecaps={tiporecaps}
                clientes={clientes}
                empresas={empresas}
                servicos={servicos}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
