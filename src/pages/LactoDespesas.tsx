import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Search, Plus, Trash2, Edit2, X, 
  User, Calendar, Truck, FileText, Printer, 
  Loader2, AlertCircle, Save, ChevronRight, Camera
} from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './LactoDespesas.css';

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

interface DespesaItem {
  id?: number;
  id_notadesp?: number;
  id_vendedor?: number;
  id_veiculo?: number;
  descricao?: string;
  datamov?: string;
  tipo?: string;
  qlitro?: number;
  vlitro?: number;
  vtotal?: number;
  kmanter?: number;
  kmatual?: number;
  dados?: string;
}

interface NotaDespesa {
  id: number;
  id_contato?: number;
  dataemi?: string;
  cpfcnpj?: string;
  nome?: string;
  vtotal: number;
  id_vendedor: number;
  datalan: string;
  status: string;
  itens: DespesaItem[];
  contato_nome?: string;
  vendedor_nome?: string;
}

export default function LactoDespesas() {
  const [notas, setNotas] = useState<NotaDespesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // OCR State
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResultText, setOcrResultText] = useState('');
  const [ocrInstructions, setOcrInstructions] = useState('');
  const ocrFileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  // Lookups
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [contatos, setContatos] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({
    id_contato: 0,
    id_vendedor: 0,
    dataemi: new Date().toISOString().split('T')[0],
    cpfcnpj: '',
    nome: '',
    vtotal: 0,
    status: '',
    itens: []
  });

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempItem, setTempItem] = useState<DespesaItem>({
    id_veiculo: 0,
    id_vendedor: 0,
    descricao: '',
    datamov: new Date().toISOString().split('T')[0],
    tipo: 'Outros',
    qlitro: 0,
    vlitro: 0,
    vtotal: 0,
    kmanter: 0,
    kmatual: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notadesp/');
      setNotas(res.data);
    } catch (err) {
      console.error("Erro ao buscar despesas:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    // Busca Vendedores
    api.get('/vendedores/')
      .then(res => setVendedores(res.data))
      .catch(err => console.error("Erro ao buscar vendedores:", err));

    // Busca Clientes/Contatos
    api.get('/clientes/')
      .then(res => setContatos(res.data))
      .catch(err => console.error("Erro ao buscar clientes:", err));

    // Busca Veículos
    api.get('/localizacao/veiculos')
      .then(res => setVeiculos(res.data || []))
      .catch(err => {
        console.error("Erro ao buscar veículos:", err);
        setVeiculos([]); // Fallback
      });
  };

  const openModal = (mode: 'create' | 'edit', nota?: NotaDespesa) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && nota) {
      setCurrentId(nota.id);
      setFormData({
        ...nota,
        dataemi: nota.dataemi?.split('T')[0] || ''
      });
    } else {
      setCurrentId(null);
      setFormData({
        id_contato: 0,
        id_vendedor: 0,
        dataemi: new Date().toISOString().split('T')[0],
        cpfcnpj: '',
        nome: '',

        vtotal: 0,
        status: '',
        obs: '',
        itens: []
      });
    }
    setIsModalOpen(true);
  };


  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Parse integer for ID fields
    if (name.startsWith('id_')) {
      const intVal = parseInt(value) || 0;
      setFormData((prev: any) => ({ ...prev, [name]: intVal }));
      
      if (name === 'id_contato' && intVal !== 0) {
        const selected = contatos.find(c => c.id === intVal);
        if (selected) {
          setFormData((prev: any) => ({
            ...prev,
            nome: selected.nome,
            cpfcnpj: selected.cpfcnpj || ''
          }));
        }
      }
      return;
    }

    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const openItemModal = (index: number | null) => {
    if (index !== null) {
      setEditingItemIndex(index);
      setTempItem({ ...formData.itens[index] });
    } else {
      setEditingItemIndex(null);
      setTempItem({
        id_veiculo: 0,
        id_vendedor: formData.id_vendedor,
        descricao: '',
        datamov: formData.dataemi,
        tipo: 'Outros',
        qlitro: 0,
        vlitro: 0,
        vtotal: 0,
        kmanter: 0,
        kmatual: 0
      });
    }
    setIsItemModalOpen(true);
  };

  const calculateTotal = (itens: DespesaItem[]) => {
    return itens.reduce((acc, item) => acc + (Number(item.vtotal) || 0), 0);
  };

  const saveItem = () => {
    const newItens = [...formData.itens];
    if (editingItemIndex !== null) {
      newItens[editingItemIndex] = tempItem;
    } else {
      newItens.push(tempItem);
    }
    setFormData((prev: any) => ({
      ...prev,
      itens: newItens,
      vtotal: calculateTotal(newItens)
    }));
    setIsItemModalOpen(false);
  };

  const removeItem = (index: number) => {
    const newItens = formData.itens.filter((_: any, i: number) => i !== index);
    setFormData((prev: any) => ({
      ...prev,
      itens: newItens,
      vtotal: calculateTotal(newItens)
    }));
  };



  const modalBodyRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.id_vendedor || formData.id_vendedor === 0) {
      setFormError("Selecione um Vendedor.");
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.itens.length === 0) {
      setFormError("Adicione pelo menos um item à despesa.");
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Preparar dados para envio, garantindo tipos corretos
    const payload = {
      ...formData,
      id_contato: (!formData.id_contato || formData.id_contato === 0 || formData.id_contato === "0") ? null : Number(formData.id_contato),
      id_vendedor: Number(formData.id_vendedor),
      vtotal: Number(formData.vtotal),
      itens: formData.itens.map((item: any) => ({
        ...item,
        id_veiculo: (!item.id_veiculo || item.id_veiculo === 0 || item.id_veiculo === "0") ? null : Number(item.id_veiculo),
        id_vendedor: (!item.id_vendedor || item.id_vendedor === 0 || item.id_vendedor === "0") ? null : Number(item.id_vendedor),
        qlitro: Number(item.qlitro || 0),
        vlitro: Number(item.vlitro || 0),
        vtotal: Number(item.vtotal || 0),
        kmanter: item.kmanter ? Number(item.kmanter) : null,
        kmatual: item.kmatual ? Number(item.kmatual) : null
      }))
    };

    try {
      setIsSubmitting(true);
      console.log("Enviando payload despesa:", payload);
      
      let response;
      if (modalMode === 'create') {
        response = await api.post('/notadesp/', payload);
      } else {
        response = await api.put(`/notadesp/${currentId}`, payload);
      }
      
      console.log("Resposta salvamento:", response.data);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      const msg = getErrorMessage(err, "Erro ao salvar nota.");
      setFormError(msg);
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNota = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta nota e todos os seus itens?")) return;
    try {
      await api.delete(`/notadesp/${id}`);
      fetchData();
    } catch (err) {
      alert("Erro ao excluir nota.");
    }
  };

  const filteredNotas = notas.filter(n => {
    const matchesSearch = searchTerm.trim() === '' || 
      n.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.id.toString().includes(searchTerm);
    
    const matchesDate = (!startDate || n.dataemi >= startDate) && 
                       (!endDate || n.dataemi <= endDate);
    
    return matchesSearch && matchesDate;
  });

  const handlePrint = () => {
    if (!selectedId) {
      alert("Selecione uma despesa na tabela para imprimir.");
      return;
    }
    document.body.classList.add('printing-notadesp-active');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-notadesp-active');
    }, 500);
  };

  const cleanString = (str: string) => String(str || "").toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

  const handleOCRFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setOcrPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessOCR = async () => {
    if (!ocrPreview) return;
    try {
      setIsScanning(true);
      setFormError('');
      
      const baseInstructions = "REGRAS CRÍTICAS: 1. O CNPJ no TOPO da nota é sempre do FORNECEDOR. 2. O CPF/CNPJ que aparece APÓS O VALOR TOTAL PAGO é do CLIENTE e deve ser COMPLETAMENTE IGNORADO. 3. Extraia km e placa se houver.";
      const combinedInstructions = ocrInstructions.trim() 
        ? `${baseInstructions} Instruções extras: ${ocrInstructions.trim()}`
        : baseInstructions;

      const response = await api.post('/ocr/analyze', { 
        image: ocrPreview,
        tipo_documento: 'despesa',
        instrucoes: combinedInstructions
      });
      
      const data = response.data;
      const cabecalho = data.cabecalho || {};
      const ocrItens = data.itens || [];
      const provedorNome = data.provedor === 'gemini' ? 'Google Gemini' : 'OpenAI GPT-4o-mini';

      // Mapear itens
      const novosItens = ocrItens.map((item: any) => {
        const placaClean = cleanString(item.veiculo || item.placa || '');
        const matchedVeic = veiculos.find(v => cleanString(v.placa) === placaClean);
        
        return {
          id_veiculo: matchedVeic?.id || 0,
          id_vendedor: formData.id_vendedor,
          descricao: item.descricao || 'Item via OCR',
          datamov: item.data || formData.dataemi,
          tipo: item.tipo || 'Outros',
          qlitro: parseFloat(item.quantidade || item.qlitro) || 0,
          vlitro: parseFloat(item.valor_unitario || item.vlitro) || 0,
          vtotal: parseFloat(item.valor_total || item.vtotal) || 0,
          kmatual: parseInt(item.km || item.kmatual) || 0
        };
      });

      // Se não houver itens mas houver dados globais, tenta mapear como um item único
      if (novosItens.length === 0 && (data.valor_total || data.vtotal)) {
         novosItens.push({
            id_veiculo: 0,
            id_vendedor: formData.id_vendedor,
            descricao: data.descricao || 'Despesa via OCR',
            datamov: data.data || formData.dataemi,
            tipo: data.tipo || 'Outros',
            qlitro: 1,
            vlitro: parseFloat(data.valor_total || data.vtotal) || 0,
            vtotal: parseFloat(data.valor_total || data.vtotal) || 0,
            kmatual: 0
         });
      }

      // Tenta encontrar o ID do contato/cliente localmente pelo CNPJ ou Nome
      const cnpjClean = cleanString(cabecalho.cpfcnpj || '');
      const nomeClean = cleanString(cabecalho.nome || '');
      const matchedContato = contatos.find(c => 
        (cnpjClean && cleanString(c.cpfcnpj) === cnpjClean) || 
        (nomeClean && cleanString(c.nome) === nomeClean)
      );

      setFormData((prev: any) => ({
        ...prev,
        id_contato: matchedContato?.id || prev.id_contato || 0,
        nome: cabecalho.nome || prev.nome,
        cpfcnpj: cabecalho.cpfcnpj || prev.cpfcnpj,
        itens: [...prev.itens, ...novosItens],
        vtotal: calculateTotal([...prev.itens, ...novosItens])
      }));

      let log = `IA (${provedorNome}) - ${new Date().toLocaleString()}\n`;
      log += `-----------------------------------\n`;
      
      log += `-----------------------------------\n`;
      
      log += `FORNECEDOR: ${cabecalho.nome || '???'}\n`;
      log += `CNPJ EMISSOR: ${cabecalho.cpfcnpj || '???'}\n`;
      log += `CPF/CNPJ CLIENTE: ${cabecalho.cpfcnpj_cliente || 'NÃO IDENTIFICADO'}\n`;
      log += `DATA EMISSÃO: ${cabecalho.data || '???'}\n`;
      log += `VEÍCULO/PLACA: ${cabecalho.veiculo || '???'}\n`;
      log += `KM: ${cabecalho.km || '???'}\n`;
      log += `TIPO DESPESA: ${cabecalho.tipo || '???'}\n`;
      log += `-----------------------------------\n`;
      log += `ITENS (${novosItens.length}):\n`;
      
      novosItens.forEach((it: any, i: number) => {
        log += `[${i+1}] ${it.descricao}\n`;
        log += `    QTD: ${it.qlitro} | UN: R$ ${it.vlitro.toFixed(2)} | TOTAL: R$ ${it.vtotal.toFixed(2)}\n`;
      });
      
      log += `-----------------------------------\n`;
      log += `TOTAL DA NOTA: R$ ${data.rodape?.valor_total || '???'}\n`;
      
      setOcrResultText(log);
      if (!isModalOpen) setModalMode('create');
      
    } catch (err: any) {
      console.error("Erro OCR:", err);
      const errorMessage = getErrorMessage(err);
      setOcrResultText("Erro no processamento OCR:\n" + errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="despesas-container fade-in">
      <div className="page-header">
        <div className="header-title-container">
          <div className="header-title">
            <DollarSign size={32} className="text-primary" />
            <h1>Despesas C/ Vendas</h1>
          </div>
          <p className="page-subtitle">Gestão de despesas comerciais e operacionais</p>
        </div>
        <div className="header-actions">
          <button className="btn-success" onClick={() => setIsOCRModalOpen(true)}>
            <Camera size={20} /> LeituraOCR
          </button>
          <button className="btn-secondary" onClick={handlePrint} disabled={!selectedId} style={{ opacity: selectedId ? 1 : 0.6 }}>
            <Printer size={20} /> Imprimir
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} /> Nova Despesa
          </button>
        </div>
      </div>

      <div className="despesas-master-section">
        <div className="form-grid-despesas">
          <div className="search-box span-2">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label><Calendar size={14} /> Início</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="input-group">
            <label><Calendar size={14} /> Fim</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data Emissão</th>
              <th>Cliente / Contato</th>
              <th>Vendedor</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Valor Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}><Loader2 className="spinning" /> Carregando...</td></tr>
            ) : filteredNotas.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Nenhuma despesa encontrada.</td></tr>
            ) : filteredNotas.map(n => (
              <tr 
                key={n.id} 
                onClick={() => setSelectedId(n.id === selectedId ? null : n.id)}
                className={selectedId === n.id ? 'row-selected' : ''}
                style={{ cursor: 'pointer' }}
              >
                <td>{n.id}</td>
                <td>{new Date(n.dataemi || '').toLocaleDateString('pt-BR')}</td>
                <td>{n.nome || n.contato_nome}</td>
                <td>{n.vendedor_nome}</td>
                <td><span className={`status-badge ${n.status}`}>{n.status || 'Pendente'}</span></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  R$ {Number(n.vtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="actions-cell">
                  <button className="icon-btn" onClick={() => openModal('edit', n)}><Edit2 size={16} /></button>
                  <button className="icon-btn delete" onClick={() => deleteNota(n.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL MESTRE */}
      {isModalOpen && (
        <div className="despesas-modal-overlay">
          <div className="despesas-modal-content">
            <div className="despesas-modal-header">
              <h2>{modalMode === 'create' ? 'Novo Lançamento de Despesa' : `Editando Despesa #${currentId}`}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            

            <form onSubmit={handleSubmit} className="despesas-modal-form">
              <div className="despesas-modal-body scrollable" ref={modalBodyRef}>
                {formError && <div className="error-alert"><AlertCircle size={18} /> {formError}</div>}
                
                <section className="modal-section mb-4">
                  <p className="divider-label">Dados do Cabeçalho</p>
                  <div className="form-grid-despesas">
                    <div className="input-group">
                      <label>Data Emissão</label>
                      <input type="date" name="dataemi" value={formData.dataemi} onChange={handleHeaderChange} required />
                    </div>
                    <div className="input-group span-2">
                      <label>Fornecedor/Contato</label>
                      <select name="id_contato" value={formData.id_contato} onChange={handleHeaderChange}>
                        <option value="0">Selecione o Fornecedor</option>
                        {contatos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Vendedor</label>

                      <select name="id_vendedor" value={formData.id_vendedor} onChange={handleHeaderChange} required>
                        <option value="0">Selecione...</option>
                        {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                      </select>
                    </div>
                    <div className="input-group span-4" style={{ marginTop: '0.5rem' }}>
                      <label>Observações</label>
                      <input 
                        type="text"
                        name="obs" 
                        value={formData.obs || ''} 
                        onChange={handleHeaderChange}
                        placeholder="Observações gerais da nota de despesa..."
                      />
                    </div>
                  </div>
                </section>

                <section className="modal-section mt-4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p className="divider-label">Itens da Despesa</p>
                    <button type="button" className="btn-primary" onClick={() => openItemModal(null)}>
                      <Plus size={16} /> Adicionar Item
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table style={{ minWidth: '1000px' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th>Data Mov.</th>
                          <th>Veículo</th>
                          <th>Descrição</th>
                          <th>Tipo</th>
                          <th>Qtde/km</th>
                          <th>Vl. Unit.</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.itens.length === 0 ? (
                          <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8' }}>Nenhum item adicionado.</td></tr>
                        ) : formData.itens.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td>{new Date(item.datamov).toLocaleDateString()}</td>
                            <td>{veiculos.find(v => v.id === item.id_veiculo)?.placa || 'N/A'}</td>
                            <td>{item.descricao}</td>
                            <td>{item.tipo}</td>
                            <td>{item.qlitro || 0}</td>
                            <td>R$ {Number(item.vlitro || 0).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: '600' }}>R$ {Number(item.vtotal || 0).toFixed(2)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="icon-btn" onClick={() => openItemModal(idx)}><Edit2 size={14} /></button>
                                <button type="button" className="icon-btn delete" onClick={() => removeItem(idx)}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="despesas-summary">
                    <div className="summary-card">
                      <label>Total de Itens</label>
                      <p>{formData.itens.length}</p>
                    </div>
                    <div className="summary-card highlight" style={{ marginLeft: 'auto' }}>
                      <label>Valor Total da Nota</label>
                      <p>R$ {Number(formData.vtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="modal-footer-despesas">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-despesas" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="spinning" /> : <Save size={18} />} Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL DE ITEM */}
      {isItemModalOpen && (
        <div className="despesas-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="despesas-modal-content" style={{ maxWidth: '700px' }}>
            <div className="despesas-modal-header">
              <h2>{editingItemIndex !== null ? 'Editar Item' : 'Novo Item de Despesa'}</h2>
              <button className="close-btn" onClick={() => setIsItemModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="despesas-modal-body scrollable">
              <div className="form-grid-despesas" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="input-group">
                  <label>Data Movimento</label>
                  <input type="date" value={tempItem.datamov?.split('T')[0]} onChange={(e) => setTempItem({...tempItem, datamov: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Veículo</label>
                  <select value={tempItem.id_veiculo} onChange={(e) => setTempItem({...tempItem, id_veiculo: parseInt(e.target.value)})}>
                    <option value="0">Nenhum / Selecione...</option>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.descricao}</option>)}
                  </select>
                </div>
                <div className="input-group span-2">
                  <label>Descrição / Detalhes</label>
                  <input type="text" value={tempItem.descricao} onChange={(e) => setTempItem({...tempItem, descricao: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Tipo de Despesa</label>
                  <select value={tempItem.tipo} onChange={(e) => setTempItem({...tempItem, tipo: e.target.value})}>
                    <option value="Combustível">Combustível</option>
                    <option value="Pedágio">Pedágio</option>
                    <option value="Refeição">Refeição</option>
                    <option value="Hospedagem">Hospedagem</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Propaganda">Propaganda</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Qtde / Litros</label>
                  <input 
                    type="number" 
                    value={tempItem.qlitro} 
                    onChange={(e) => {
                      const q = parseFloat(e.target.value) || 0;
                      setTempItem({...tempItem, qlitro: q, vtotal: q * (tempItem.vlitro || 0)})
                    }} 
                  />
                </div>
                <div className="input-group">
                  <label>Valor Unitário</label>
                  <input 
                    type="number" 
                    value={tempItem.vlitro} 
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setTempItem({...tempItem, vlitro: v, vtotal: v * (tempItem.qlitro || 0)})
                    }} 
                  />
                </div>
                <div className="input-group">
                  <label>Valor Total do Item</label>
                  <input 
                    type="number" 
                    style={{ background: '#f8fafc', fontWeight: 'bold' }}
                    value={tempItem.vtotal} 
                    onChange={(e) => setTempItem({...tempItem, vtotal: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="input-group">
                  <label>KM Atual</label>
                  <input type="number" value={tempItem.kmatual} onChange={(e) => setTempItem({...tempItem, kmatual: parseInt(e.target.value) || 0})} />
                </div>
              </div>
            </div>
            <div className="modal-footer-despesas">
              <button className="btn-secondary" onClick={() => setIsItemModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveItem}>Confirmar Item</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OCR */}
      {isOCRModalOpen && (
        <div className="despesas-modal-overlay" style={{ zIndex: 1200 }}>
          <div className="ocr-modal-box">
            <div className="ocr-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a' }}>
                  <Camera className="text-primary" /> Leitura Inteligente (OCR)
                </h2>
                <button className="close-btn" onClick={() => setIsOCRModalOpen(false)}><X size={24} /></button>
              </div>
            </div>
            <div className="ocr-body">
              <p className="ocr-instruction">Tire uma foto ou anexe a imagem do comprovante de despesa.</p>
              
              <div className="ocr-upload-zone" onClick={() => ocrFileInputRef.current?.click()}>
                {ocrPreview ? (
                  <img src={ocrPreview} alt="Preview" className="ocr-image-preview" />
                ) : (
                  <div className="ocr-placeholder">
                    <div className="upload-icon-container">
                      <Plus size={32} className="text-primary" />
                    </div>
                    <span>Clique para capturar ou anexar</span>
                  </div>
                )}
              </div>

              <div className="ocr-middle-actions" style={{ margin: '1rem 0' }}>
                <input 
                  type="text" 
                  placeholder="Instruções extras p/ IA (ex: focar apenas no valor total)"
                  className="ocr-instruction-input"
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem', 
                    borderRadius: '8px', 
                    background: 'rgba(0,0,0,0.05)', 
                    border: '1px solid rgba(0,0,0,0.1)', 
                    color: '#1e293b',
                    fontSize: '0.9rem'
                  }}
                  value={ocrInstructions}
                  onChange={(e) => setOcrInstructions(e.target.value)}
                />
              </div>

              <div className="ocr-action-buttons">
                <button className="btn-camera-action" onClick={() => cameraInputRef.current?.click()}>
                  <Camera size={18} /> Câmera
                </button>
                <button className="btn-camera-action" onClick={() => ocrFileInputRef.current?.click()}>
                  <FileText size={18} /> Selecionar Foto
                </button>
                {ocrPreview && (
                  <button className="btn-send-ia" onClick={handleProcessOCR} disabled={isScanning}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                      {isScanning ? <Loader2 className="spinning" /> : <Save size={18} />}
                      <span>{isScanning ? 'Processando...' : 'Enviar para IA'}</span>
                    </div>
                  </button>
                )}
              </div>

              {ocrResultText && (
                <div className="ocr-result-section">
                  <label className="memo-label">Resultado da Análise</label>
                  <textarea className="ocr-memo-field" readOnly value={ocrResultText} />
                </div>
              )}
            </div>

            <div className="ocr-footer">
              <div className="ocr-action-buttons">
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsOCRModalOpen(false)}>Fechar</button>
                {ocrPreview && <button className="btn-accent" style={{ flex: 1, backgroundColor: '#ef4444' }} onClick={() => { setOcrPreview(null); setOcrResultText(''); }}>Descartar</button>}
                {ocrResultText && (
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                    setIsOCRModalOpen(false);
                    setIsModalOpen(true);
                  }}>
                    Gerar Despesa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inputs Ocultos */}
      <input type="file" ref={ocrFileInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleOCRFileChange(e)} />
      <input type="file" ref={cameraInputRef} style={{ display: 'none' }} accept="image/*" capture="environment" onChange={(e) => handleOCRFileChange(e, true)} />

      {/* Overlay de Processamento */}
      {isScanning && (
        <div className="scanning-overlay" key="scanning-overlay-global">
          <div className="scanning-card">
            <Loader2 size={48} className="spinning text-primary" />
            <h3 style={{ marginTop: '1.5rem' }}>Analisando Comprovante...</h3>
            <p>Nossa IA está extraindo os dados para você.</p>
          </div>
        </div>
      )}

      {/* TEMPLATE DE IMPRESSÃO (Oculto na tela, visível apenas no @media print) */}
      <div id="print-notadesp-section">
        {selectedId && (
          <div className="print-template">
            <div className="print-header">
              <div className="print-logo-section">
                <DollarSign size={40} className="text-primary" />
                <div>
                  <h2>TOTALCAP</h2>
                  <p>Nota de Despesa / Reembolso</p>
                </div>
              </div>
              <div className="print-id-section">
                <span className="print-id-label">NÚMERO</span>
                <span className="print-id-value">#{selectedId}</span>
              </div>
            </div>

            <div className="print-info-grid">
              <div className="info-block">
                <span className="info-label">Cliente / Contato</span>
                <span className="info-value">{notas.find(n => n.id === selectedId)?.nome || 'N/A'}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Data Emissão</span>
                <span className="info-value">{new Date(notas.find(n => n.id === selectedId)?.dataemi || '').toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Vendedor</span>
                <span className="info-value">{notas.find(n => n.id === selectedId)?.vendedor_nome || 'N/A'}</span>
              </div>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Veículo</th>
                  <th>Descrição / Tipo</th>
                  <th>Qtde</th>
                  <th style={{ textAlign: 'right' }}>Vl. Unit.</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {notas.find(n => n.id === selectedId)?.itens.map((item, idx) => (
                  <tr key={idx}>
                    <td>{new Date(item.datamov || '').toLocaleDateString('pt-BR')}</td>
                    <td>{veiculos.find(v => v.id === item.id_veiculo)?.placa || '-'}</td>
                    <td>{item.descricao} ({item.tipo})</td>
                    <td>{item.qlitro}</td>
                    <td style={{ textAlign: 'right' }}>R$ {Number(item.vlitro).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>R$ {Number(item.vtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold' }}>VALOR TOTAL FINAL:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    R$ {Number(notas.find(n => n.id === selectedId)?.vtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="print-signatures">
              <div className="signature-box">
                <div className="signature-line"></div>
                <span>ASSINATURA DO VENDEDOR</span>
              </div>
              <div className="signature-box">
                <div className="signature-line"></div>
                <span>ASSINATURA DO CLIENTE</span>
              </div>
            </div>
            
            <div className="print-footer">
              Documento gerado pelo Sistema Totalcap em {new Date().toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
