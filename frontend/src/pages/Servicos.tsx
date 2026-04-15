import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Printer } from 'lucide-react';
import api from '../lib/api';
import './Servicos.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Medida {
  id: number;
  descricao: string;
}

interface Desenho {
  id: number;
  descricao: string;
}

interface Marca {
  id: number;
  descricao: string;
}

interface TipoRecapagem {
  id: number;
  descricao: string;
}

interface Servico {
  id: number;
  codservico: string;
  descricao: string;
  piso: string;
  id_medida: number | null;
  id_desenho: number | null;
  id_marca: number | null;
  id_recap: number | null;
  ativo: boolean;
  medida?: { id: number; descricao: string };
  desenho?: { id: number; descricao: string };
  marca?: { id: number; descricao: string };
  recap?: { id: number; descricao: string };
}

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [filteredServicos, setFilteredServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auxiliary data
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [desenhos, setDesenhos] = useState<Desenho[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [tiposRecap, setTiposRecap] = useState<TipoRecapagem[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    codservico: '',
    descricao: '',
    piso: '',
    id_medida: '' as string | number,
    id_desenho: '' as string | number,
    id_marca: '' as string | number,
    id_recap: '' as string | number,
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
      setFilteredServicos(servicos);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredServicos(servicos.filter(s => 
        s.descricao.toLowerCase().includes(lowerSearch) ||
        s.codservico?.toLowerCase().includes(lowerSearch) ||
        s.medida?.descricao.toLowerCase().includes(lowerSearch) ||
        s.marca?.descricao.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, servicos]);

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
        api.get('/marcas/'),
        api.get('/tipo-recapagem/')
      ]);
      setMedidas(mRes.data);
      setDesenhos(dRes.data);
      setMarcas(maRes.data);
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
        codservico: servico.codservico || '',
        descricao: servico.descricao,
        piso: servico.piso || '',
        id_medida: servico.id_medida || '',
        id_desenho: servico.id_desenho || '',
        id_marca: servico.id_marca || '',
        id_recap: servico.id_recap || '',
        ativo: servico.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        codservico: '',
        descricao: '',
        piso: '',
        id_medida: '',
        id_desenho: '',
        id_marca: '',
        id_recap: '',
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
    if (!formData.descricao.trim()) {
      setFormError('A descrição do serviço é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    // Prepare data (convert empty strings to null for technical fields)
    const payload = {
      ...formData,
      id_medida: formData.id_medida === '' ? null : Number(formData.id_medida),
      id_desenho: formData.id_desenho === '' ? null : Number(formData.id_desenho),
      id_marca: formData.id_marca === '' ? null : Number(formData.id_marca),
      id_recap: formData.id_recap === '' ? null : Number(formData.id_recap)
    };

    try {
      if (modalMode === 'create') {
        await api.post('/servicos/', payload);
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/servicos/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o serviço "${descricao}"?`)) {
      try {
        await api.delete(`/servicos/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir serviço:", error);
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
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Serviço
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por descrição, código ou medida..." 
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
                  <th>Marca / Desenho</th>
                  <th>T. Recap</th>
                  <th style={{ width: '80px' }}>Piso</th>
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
                      <td><strong>{s.codservico || '-'}</strong></td>
                      <td>
                        <div className="servico-info">
                          <span className="servico-desc">{s.descricao}</span>
                          {s.medida && <span className="servico-sub">Medida: {s.medida.descricao}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="servico-info">
                          <span>{s.marca?.descricao || '-'}</span>
                          {s.desenho && <span className="servico-sub">{s.desenho.descricao}</span>}
                        </div>
                      </td>
                      <td>{s.recap?.descricao || '-'}</td>
                      <td>{s.piso || '-'}</td>
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
              <h2>{modalMode === 'create' ? 'Novo Serviço' : 'Editar Serviço'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body grid-2">
                {formError && <div className="form-error full-width">{formError}</div>}
                
                <div className="form-group">
                  <label htmlFor="codservico">Código do Serviço</label>
                  <input className="form-input" id="codservico" value={formData.codservico} onChange={handleChange} placeholder="Ex: SERV001" />
                </div>

                <div className="form-group">
                  <label htmlFor="descricao">Descrição *</label>
                  <input className="form-input" id="descricao" value={formData.descricao} onChange={handleChange} placeholder="Ex: Recapagem Fria" required />
                </div>

                <div className="form-group">
                  <label htmlFor="id_medida">Medida</label>
                  <select className="form-select" id="id_medida" value={formData.id_medida} onChange={handleChange}>
                    <option value="">Selecione a Medida</option>
                    {medidas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="id_desenho">Desenho</label>
                  <select className="form-select" id="id_desenho" value={formData.id_desenho} onChange={handleChange}>
                    <option value="">Selecione o Desenho</option>
                    {desenhos.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="id_marca">Marca</label>
                  <select className="form-select" id="id_marca" value={formData.id_marca} onChange={handleChange}>
                    <option value="">Selecione a Marca</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="id_recap">Tipo de Recapagem</label>
                  <select className="form-select" id="id_recap" value={formData.id_recap} onChange={handleChange}>
                    <option value="">Selecione o Tipo</option>
                    {tiposRecap.map(r => <option key={r.id} value={r.id}>{r.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="piso">Piso</label>
                  <input className="form-input" id="piso" value={formData.piso} onChange={handleChange} placeholder="Ex: C1, Urbano, etc." />
                </div>

                <div className="form-group full-width">
                  <div className="checkbox-group">
                    <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                    <label htmlFor="ativo">Serviço ativo para novas ordens</label>
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
