import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, ExternalLink, Printer } from 'lucide-react';
import api from '../lib/api';
import './Vendedores.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface Area {
  id: number;
  nome: string;
}

interface Regiao {
  id: number;
  nome: string;
}

interface Vendedor {
  id: number;
  codigo: string;
  apelido: string;
  nome: string;
  id_area: number | null;
  id_regiao: number | null;
  area_nome?: string;
  regiao_nome?: string;
  endereco: string;
  cep: string;
  cidade: string;
  uf: string;
  fone: string;
  cpfcnpj: string;
  cargo: string;
  ativo: boolean;
}

export default function Vendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [filteredVendedores, setFilteredVendedores] = useState<Vendedor[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    apelido: '',
    nome: '',
    id_area: '',
    id_regiao: '',
    endereco: '',
    cep: '',
    cidade: '',
    uf: '',
    fone: '',
    cpfcnpj: '',
    cargo: '',
    ativo: true
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVendedores(vendedores);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredVendedores(vendedores.filter(v => 
        v.nome.toLowerCase().includes(lowerSearch) || 
        v.apelido?.toLowerCase().includes(lowerSearch) ||
        v.codigo?.toLowerCase().includes(lowerSearch)
      ));
    }
  }, [searchTerm, vendedores]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendRes, areasRes, regioesRes] = await Promise.all([
        api.get('/vendedores/'),
        api.get('/areas/'),
        api.get('/regioes/')
      ]);
      setVendedores(vendRes.data);
      setAreas(areasRes.data);
      setRegioes(regioesRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', vendedor?: Vendedor) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && vendedor) {
      setCurrentId(vendedor.id);
      setFormData({
        codigo: vendedor.codigo || '',
        apelido: vendedor.apelido || '',
        nome: vendedor.nome,
        id_area: vendedor.id_area?.toString() || '',
        id_regiao: vendedor.id_regiao?.toString() || '',
        endereco: vendedor.endereco || '',
        cep: vendedor.cep || '',
        cidade: vendedor.cidade || '',
        uf: vendedor.uf || '',
        fone: vendedor.fone || '',
        cpfcnpj: vendedor.cpfcnpj || '',
        cargo: vendedor.cargo || '',
        ativo: vendedor.ativo
      });
    } else {
      setCurrentId(null);
      setFormData({
        codigo: '',
        apelido: '',
        nome: '',
        id_area: '',
        id_regiao: '',
        endereco: '',
        cep: '',
        cidade: '',
        uf: '',
        fone: '',
        cpfcnpj: '',
        cargo: '',
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCepSearch = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      alert('Por favor, informe um CEP válido com 8 dígitos.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado.');
      } else {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro + (data.bairro ? ` - ${data.bairro}` : ''),
          cidade: data.localidade,
          uf: data.uf
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert('Erro ao consultar o serviço de CEP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setFormError('O nome é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload = {
      ...formData,
      id_area: formData.id_area ? parseInt(formData.id_area) : null,
      id_regiao: formData.id_regiao ? parseInt(formData.id_regiao) : null,
    };

    try {
      if (modalMode === 'create') {
        await api.post('/vendedores/', payload);
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/vendedores/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar vendedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number, nomeVendedor: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o vendedor "${nomeVendedor}"?`)) {
      try {
        await api.delete(`/vendedores/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Erro ao excluir vendedor:", error);
        alert('Erro ao excluir o vendedor.');
      }
    }
  };

  return (
    <div className="vendedores-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Relatório de Vendedores</h1>
      </div>

      <div className="page-header">
        <h1 className="title">Vendedores</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} />
            Novo Vendedor
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar vendedores..." 
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
                  <th>ID</th>
                  <th>Apelido</th>
                  <th>Nome</th>
                  <th>Área</th>
                  <th>Região</th>
                  <th>Cidade/UF</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendedores.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">Nenhum vendedor encontrado.</td></tr>
                ) : (
                  filteredVendedores.map(v => (
                    <tr key={v.id}>
                      <td>#{v.id}</td>
                      <td><strong>{v.apelido || '-'}</strong></td>
                      <td>{v.nome}</td>
                      <td>{v.area_nome || '-'}</td>
                      <td>{v.regiao_nome || '-'}</td>
                      <td>{v.cidade}/{v.uf}</td>
                      <td>
                        <span className={`status-badge ${v.ativo ? 'active' : 'inactive'}`}>
                          {v.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openModal('edit', v)}><Edit2 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(v.id, v.nome)}><Trash2 size={16} /></button>
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Novo Vendedor' : 'Editar Vendedor'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="codigo">Código</label>
                    <input className="form-input" id="codigo" value={formData.codigo} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="apelido">Apelido</label>
                    <input className="form-input" id="apelido" value={formData.apelido} onChange={handleChange} />
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="nome">Nome Completo *</label>
                    <input className="form-input" id="nome" value={formData.nome} onChange={handleChange} required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="id_area">Área</label>
                    <select className="form-select" id="id_area" value={formData.id_area} onChange={handleChange}>
                      <option value="">Selecione...</option>
                      {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="id_regiao">Região</label>
                    <select className="form-select" id="id_regiao" value={formData.id_regiao} onChange={handleChange}>
                      <option value="">Selecione...</option>
                      {regioes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label htmlFor="cep">CEP</label>
                      <a 
                        href="https://buscacepinter.correios.com.br/app/endereco/index.php" 
                        target="_blank" 
                        rel="noreferrer"
                        className="cep-link"
                        title="Buscar no site dos Correios"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--primary-color)', textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} />
                        Site Correios
                      </a>
                    </div>
                    <div className="cep-input-group">
                      <input 
                        className="form-input" 
                        id="cep" 
                        value={formData.cep} 
                        onChange={handleChange} 
                        placeholder="00000-000"
                      />
                      <button 
                        type="button" 
                        className="btn-cep-search" 
                        onClick={handleCepSearch}
                        disabled={isSubmitting}
                        title="Buscar endereço automaticamente"
                      >
                        {isSubmitting ? '...' : <Search size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="fone">Telefone</label>
                    <input className="form-input" id="fone" value={formData.fone} onChange={handleChange} />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="endereco">Endereço</label>
                    <input className="form-input" id="endereco" value={formData.endereco} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cidade">Cidade</label>
                    <input className="form-input" id="cidade" value={formData.cidade} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="uf">UF</label>
                    <input className="form-input" id="uf" value={formData.uf} onChange={handleChange} maxLength={2} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cpfcnpj">CPF / CNPJ</label>
                    <input className="form-input" id="cpfcnpj" value={formData.cpfcnpj} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cargo">Cargo</label>
                    <input className="form-input" id="cargo" value={formData.cargo} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <div className="checkbox-group" style={{ marginTop: 0 }}>
                      <input type="checkbox" id="ativo" checked={formData.ativo} onChange={handleChange} />
                      <label htmlFor="ativo">Vendedor ativo</label>
                    </div>
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
