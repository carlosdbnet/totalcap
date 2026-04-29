import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Truck,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './Veiculos.css';

interface Veiculo {
  id: number;
  placa: string;
  descricao: string;
  codven?: string;
  tipo?: string;
  comb?: string;
  plaqueta?: number;
  uf?: string;
  codmod?: string;
  renavam?: string;
  chassi?: string;
  ano?: string;
  alienado: boolean;
  bancofin?: string;
  sinistro: boolean;
  seguradora?: string;
  antt?: string;
  ativo: boolean;
}

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Veiculo>>({
    placa: '',
    descricao: '',
    ativo: true,
    alienado: false,
    sinistro: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const fetchVeiculos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/veiculos');
      setVeiculos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', veiculo?: Veiculo) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && veiculo) {
      setCurrentId(veiculo.id);
      setFormData(veiculo);
    } else {
      setCurrentId(null);
      setFormData({
        placa: '',
        descricao: '',
        ativo: true,
        alienado: false,
        sinistro: false
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError('');
      if (modalMode === 'create') {
        await api.post('/veiculos', formData);
      } else {
        await api.put(`/veiculos/${currentId}`, formData);
      }
      setIsModalOpen(false);
      fetchVeiculos();
    } catch (err: any) {
      setFormError(getErrorMessage(err, "Erro ao salvar veículo."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteVeiculo = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este veículo?")) return;
    try {
      await api.delete(`/veiculos/${id}`);
      fetchVeiculos();
    } catch (err) {
      alert("Erro ao excluir veículo.");
    }
  };


  const filteredVeiculos = veiculos.filter(v => 
    v.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="veiculos-container fade-in">
      <div className="page-header">
        <div className="header-title">
          <Truck size={32} className="text-primary" />
          <h1>Cadastro de Veículos</h1>
        </div>
        <button className="btn-primary" onClick={() => openModal('create')}>
          <Plus size={20} /> Novo Veículo
        </button>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input 
          type="text" 
          placeholder="Buscar por placa ou descrição..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Placa</th>
              <th>Descrição</th>
              <th>Ano</th>
              <th>UF</th>
              <th>Ativo</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>
                  <Loader2 className="spinning" /> Carregando...
                </td>
              </tr>
            ) : filteredVeiculos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>Nenhum veículo encontrado.</td>
              </tr>
            ) : filteredVeiculos.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td className="font-bold">{v.placa}</td>
                <td>{v.descricao}</td>
                <td>{v.ano}</td>
                <td>{v.uf}</td>
                <td>
                  <span className={`status-badge ${v.ativo ? 'active' : 'inactive'}`}>
                    {v.ativo ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td>
                  <div className="actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button 
                      className="btn-icon-premium edit" 
                      onClick={() => openModal('edit', v)}
                      title="Editar"
                      style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className="btn-icon-premium delete" 
                      onClick={() => deleteVeiculo(v.id)}
                      title="Excluir"
                      style={{ background: '#ef4444', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Novo Veículo' : 'Editar Veículo'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable">
                {formError && <div className="error-alert"><AlertCircle size={18} /> {formError}</div>}
                

                <div className="form-grid">
                  <div className="input-group">
                    <label>Placa *</label>
                    <input 
                      type="text" 
                      name="placa" 
                      value={formData.placa} 
                      onChange={handleInputChange} 
                      placeholder="ABC-1234"
                      required 
                    />
                  </div>
                  <div className="input-group span-2">
                    <label>Descrição</label>
                    <input 
                      type="text" 
                      name="descricao" 
                      value={formData.descricao} 
                      onChange={handleInputChange} 
                      placeholder="Ex: Scania R450"
                    />
                  </div>
                  <div className="input-group">
                    <label>Tipo</label>
                    <input type="text" name="tipo" value={formData.tipo || ''} onChange={handleInputChange} maxLength={1} placeholder="C/M/O" />
                  </div>
                  
                  <div className="input-group">
                    <label>Modelo</label>
                    <input type="text" name="codmod" value={formData.codmod || ''} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Ano</label>
                    <input type="text" name="ano" value={formData.ano || ''} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>UF</label>
                    <input type="text" name="uf" value={formData.uf || ''} onChange={handleInputChange} maxLength={2} />
                  </div>
                  <div className="input-group">
                    <label>Plaqueta</label>
                    <input type="number" name="plaqueta" value={formData.plaqueta || ''} onChange={handleInputChange} />
                  </div>

                  <div className="input-group">
                    <label>Combustível</label>
                    <select name="comb" value={formData.comb || ''} onChange={handleInputChange}>
                      <option value="">Selecione...</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="Flex">Flex</option>
                      <option value="GNV">GNV</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Renavam</label>
                    <input type="text" name="renavam" value={formData.renavam || ''} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Chassi</label>
                    <input type="text" name="chassi" value={formData.chassi || ''} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>ANTT</label>
                    <input type="text" name="antt" value={formData.antt || ''} onChange={handleInputChange} />
                  </div>

                  <div className="input-group">
                    <label>Cód. Vendedor</label>
                    <input type="text" name="codven" value={formData.codven || ''} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Seguradora</label>
                    <input type="text" name="seguradora" value={formData.seguradora || ''} onChange={handleInputChange} />
                  </div>
                  <div className="input-group span-2">
                    <label>Banco Financiamento</label>
                    <input type="text" name="bancofin" value={formData.bancofin || ''} onChange={handleInputChange} />
                  </div>

                  <div className="checkbox-group span-4">
                    <label className="checkbox-label">
                      <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleInputChange} />
                      Veículo Ativo
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="alienado" checked={formData.alienado} onChange={handleInputChange} />
                      Alienado
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="sinistro" checked={formData.sinistro} onChange={handleInputChange} />
                      Com Sinistro
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="spinning" /> : <Save size={18} />}
                  {modalMode === 'create' ? 'Cadastrar' : 'Atualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
