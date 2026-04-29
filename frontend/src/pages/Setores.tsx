import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer, Settings } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Setores.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Setor {
  id: number;
  codigo: string;
  descricao: string;
  sequencia: number;
  tempomedio: number;
  tempominimo: number;
  qmeta: number;
  proxsetor: string;
  sopassagem: boolean;
  avaliacao: boolean;
  falha: boolean;
  consumomp: boolean;
  faturamento: boolean;
  expedicao: boolean;
  supervisao: boolean;
  ativo: boolean;
}

export default function Setores() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [filteredSetores, setFilteredSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    sequencia: 0,
    tempomedio: 0,
    tempominimo: 0,
    qmeta: 0,
    proxsetor: '',
    sopassagem: false,
    avaliacao: false,
    falha: false,
    consumomp: false,
    faturamento: false,
    expedicao: false,
    supervisao: false,
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSetores(setores);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredSetores(setores.filter(s => 
        s.descricao.toLowerCase().includes(lowerSearch) ||
        s.codigo?.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, setores]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/setores/');
      setSetores(response.data);
    } catch (error) {
      console.error("Erro ao buscar setores:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', setor?: Setor) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && setor) {
      setCurrentId(setor.id);
      setFormData({
        codigo: setor.codigo || '',
        descricao: setor.descricao,
        sequencia: setor.sequencia || 0,
        tempomedio: setor.tempomedio || 0,
        tempominimo: setor.tempominimo || 0,
        qmeta: setor.qmeta || 0,
        proxsetor: setor.proxsetor || '',
        sopassagem: setor.sopassagem || false,
        avaliacao: setor.avaliacao || false,
        falha: setor.falha || false,
        consumomp: setor.consumomp || false,
        faturamento: setor.faturamento || false,
        expedicao: setor.expedicao || false,
        supervisao: setor.supervisao || false,
        ativo: setor.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        codigo: '',
        descricao: '',
        sequencia: 0,
        tempomedio: 0,
        tempominimo: 0,
        qmeta: 0,
        proxsetor: '',
        sopassagem: false,
        avaliacao: false,
        falha: false,
        consumomp: false,
        faturamento: false,
        expedicao: false,
        supervisao: false,
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao.trim()) {
      setFormError('A descrição do setor é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await api.post('/setores/', formData);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/setores/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar setor.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o setor "${descricao}"?`)) {
      try {
        await api.delete(`/setores/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir setor:", error);
        alert('Erro ao excluir o setor.');
      }
    }
  };

  return (
    <div className="setores-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Setores de Produção</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Setores</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Setor
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar setores por código ou descrição..." 
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
                  <th style={{ width: '60px' }}>Seq</th>
                  <th style={{ width: '80px' }}>Código</th>
                  <th>Descrição / Próx.</th>
                  <th style={{ width: '200px' }}>Flags Processo</th>
                  <th style={{ width: '80px' }}>Meta</th>
                  <th style={{ width: '80px' }}>Status</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSetores.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">Nenhum setor encontrado.</td></tr>
                ) : (
                  filteredSetores.sort((a,b) => (a.sequencia || 0) - (b.sequencia || 0)).map(s => (
                    <tr key={s.id}>
                      <td>{s.sequencia || '-'}</td>
                      <td><strong>{s.codigo || '-'}</strong></td>
                      <td>
                        <div className="servico-info">
                          <span className="servico-desc">{s.descricao}</span>
                          {s.proxsetor && <span className="servico-sub">Próximo: {s.proxsetor}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flag-container">
                          {s.sopassagem && <span className="flag-badge" title="Só Passagem">PS</span>}
                          {s.avaliacao && <span className="flag-badge" title="Avaliação">AV</span>}
                          {s.falha && <span className="flag-badge danger" title="Registra Falha">FL</span>}
                          {s.consumomp && <span className="flag-badge success" title="Consumo MP">MP</span>}
                          {s.faturamento && <span className="flag-badge primary" title="Faturamento">FT</span>}
                          {s.expedicao && <span className="flag-badge warning" title="Expedição">EX</span>}
                        </div>
                      </td>
                      <td>{s.qmeta || 0}</td>
                      <td>
                        <span className={`status-badge ${s.ativo ? 'active' : 'inactive'}`}>
                          {s.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn-icon-premium edit" 
                            onClick={() => openModal('edit', s)}
                            title="Editar"
                            style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon-premium delete" 
                            onClick={() => handleDelete(s.id, s.descricao)}
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
          <div className="premium-modal-content large" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Setor' : 'Editar Setor'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
                {formError && <div className="form-error full-width">{formError}</div>}
                
                <div className="premium-master-panel" style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <section className="form-section full-width" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <Settings size={18} color="var(--primary-color)" /> <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>Dados Básicos</h3>
                  </section>

                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label htmlFor="codigo" style={{ fontWeight: '600', color: '#475569' }}>Código</label>
                      <input className="form-input" id="codigo" value={formData.codigo} onChange={handleChange} placeholder="Ex: VULC" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="descricao" style={{ fontWeight: '600', color: '#475569' }}>Descrição *</label>
                      <input className="form-input" id="descricao" value={formData.descricao} onChange={handleChange} placeholder="Ex: VULCANIZAÇÃO" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="sequencia" style={{ fontWeight: '600', color: '#475569' }}>Sequência</label>
                      <input type="number" className="form-input" id="sequencia" value={formData.sequencia} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="proxsetor" style={{ fontWeight: '600', color: '#475569' }}>Próximo Setor</label>
                      <input className="form-input" id="proxsetor" value={formData.proxsetor} onChange={handleChange} placeholder="Ex: EXPED" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <section className="form-section full-width" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <Settings size={18} color="var(--primary-color)" /> <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>Tempos e Metas</h3>
                  </section>

                  <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label htmlFor="tempomedio" style={{ fontWeight: '600', color: '#475569' }}>Tempo Médio (min)</label>
                      <input type="number" className="form-input" id="tempomedio" value={formData.tempomedio} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="tempominimo" style={{ fontWeight: '600', color: '#475569' }}>Tempo Mínimo (min)</label>
                      <input type="number" className="form-input" id="tempominimo" value={formData.tempominimo} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="qmeta" style={{ fontWeight: '600', color: '#475569' }}>Meta Diária</label>
                      <input type="number" className="form-input" id="qmeta" value={formData.qmeta} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <section className="form-section full-width" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <Settings size={18} color="var(--primary-color)" /> <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>Configurações de Processo</h3>
                  </section>

                  <div className="checkbox-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="sopassagem" checked={formData.sopassagem} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="sopassagem" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Só Passagem</label>
                    </div>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="avaliacao" checked={formData.avaliacao} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="avaliacao" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Avaliação</label>
                    </div>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="falha" checked={formData.falha} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="falha" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Registra Falha</label>
                    </div>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="consumomp" checked={formData.consumomp} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="consumomp" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Consumo MP</label>
                    </div>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="faturamento" checked={formData.faturamento} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="faturamento" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Faturamento</label>
                    </div>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="expedicao" checked={formData.expedicao} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="expedicao" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Expedição</label>
                    </div>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="supervisao" checked={formData.supervisao} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="supervisao" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Supervisão</label>
                    </div>
                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="ativo" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Ativo</label>
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
