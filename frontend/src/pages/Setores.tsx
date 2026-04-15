import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer, Settings } from 'lucide-react';
import api from '../lib/api';
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
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/setores/${currentId}`, formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar setor.');
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
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Novo Setor' : 'Editar Setor'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body grid-form">
                {formError && <div className="form-error full-width">{formError}</div>}
                
                <section className="form-section full-width">
                  <Settings size={16} /> <h3>Dados Básicos</h3>
                </section>

                <div className="form-group">
                  <label htmlFor="codigo">Código</label>
                  <input className="form-input" id="codigo" value={formData.codigo} onChange={handleChange} placeholder="Ex: VULC" />
                </div>

                <div className="form-group">
                  <label htmlFor="descricao">Descrição *</label>
                  <input className="form-input" id="descricao" value={formData.descricao} onChange={handleChange} placeholder="Ex: VULCANIZAÇÃO" required />
                </div>

                <div className="form-group">
                  <label htmlFor="sequencia">Sequência</label>
                  <input type="number" className="form-input" id="sequencia" value={formData.sequencia} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label htmlFor="proxsetor">Próximo Setor</label>
                  <input className="form-input" id="proxsetor" value={formData.proxsetor} onChange={handleChange} placeholder="Ex: EXPED" />
                </div>

                <section className="form-section full-width">
                  <Settings size={16} /> <h3>Tempos e Metas</h3>
                </section>

                <div className="form-group">
                  <label htmlFor="tempomedio">Tempo Médio (min)</label>
                  <input type="number" className="form-input" id="tempomedio" value={formData.tempomedio} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label htmlFor="tempominimo">Tempo Mínimo (min)</label>
                  <input type="number" className="form-input" id="tempominimo" value={formData.tempominimo} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label htmlFor="qmeta">Meta Diária</label>
                  <input type="number" className="form-input" id="qmeta" value={formData.qmeta} onChange={handleChange} />
                </div>

                <section className="form-section full-width">
                  <Settings size={16} /> <h3>Configurações de Processo</h3>
                </section>

                <div className="checkbox-grid full-width">
                  <div className="checkbox-group">
                    <input type="checkbox" id="sopassagem" checked={formData.sopassagem} onChange={handleChange} />
                    <label htmlFor="sopassagem">Só Passagem</label>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="avaliacao" checked={formData.avaliacao} onChange={handleChange} />
                    <label htmlFor="avaliacao">Avaliação</label>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="falha" checked={formData.falha} onChange={handleChange} />
                    <label htmlFor="falha">Registra Falha</label>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="consumomp" checked={formData.consumomp} onChange={handleChange} />
                    <label htmlFor="consumomp">Consumo MP</label>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="faturamento" checked={formData.faturamento} onChange={handleChange} />
                    <label htmlFor="faturamento">Faturamento</label>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="expedicao" checked={formData.expedicao} onChange={handleChange} />
                    <label htmlFor="expedicao">Expedição</label>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="supervisao" checked={formData.supervisao} onChange={handleChange} />
                    <label htmlFor="supervisao">Supervisão</label>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                    <label htmlFor="ativo">Ativo</label>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
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
