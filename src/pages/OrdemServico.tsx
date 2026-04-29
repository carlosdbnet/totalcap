import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import {
  Plus, Search, Edit2, Trash2, X, Printer, Package,
  User, Truck, Calendar, FileText, Settings,
  Hash, DollarSign, Eye
} from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import './OrdemServico.css';
import './PrintFicha.css';
import './PrintOS.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface OSPneu {
  id?: number;
  id_medida?: number;
  id_marca?: number;
  id_desenho?: number;
  id_servico?: number;
  id_recap?: number;
  numserie?: string;
  numfogo?: string;
  dot?: string;
  valor: number;
  statuspro: boolean;
  statusfat: boolean;
  statuspro_label?: string;
  obs?: string;
}

interface OrdemServico {
  id: number;
  numos: string;
  dataentrada?: string;
  dataprevisao?: string;
  id_contato: number;
  id_vendedor?: number;
  observacao?: string;
  status: string;
  vrservico: number;
  vrtotal: number;
  vrproduto: number;
  vrcarcaca: number;
  vrbonus: number;
  vrmontagem: number;
  pcomissao: number;
  vrcomissao: number;
  id_planopag?: number;
  id_mobos?: number;
  pneus: OSPneu[];
}

export default function OrdemServico() {
  const [oss, setOss] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<any>(null);

  // Search State (Unified with Producao)
  const [searchParams, setSearchParams] = useState({
    id: '',
    numos: '',
    cliente: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [filteredClientes, setFilteredClientes] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Lookups
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [transportadoras, setTransportadoras] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [desenhos, setDesenhos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [tiposRecap, setTiposRecap] = useState<any[]>([]);
  const [planosPagamento, setPlanosPagamento] = useState<any[]>([]);
  const [regioes, setRegioes] = useState<any[]>([]);

  // Modal STate
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Selection State
  const [selectedPneus, setSelectedPneus] = useState<number[]>([]);

  // Form State
  const [pneusForPrint, setPneusForPrint] = useState<any[]>([]);
  const [osToPrint, setOsToPrint] = useState<OrdemServico | null>(null);

  const [formData, setFormData] = useState<any>({
    numos: '',
    dataentrada: '',
    dataprevisao: '',
    id_contato: 0,
    id_vendedor: 0,
    id_planopag: 0,
    observacao: '',
    status: 'ABERTA',
    vrservico: 0,
    vrtotal: 0,
    vrproduto: 0,
    vrcarcaca: 0,
    vrbonus: 0,
    vrmontagem: 0,
    pcomissao: 0,
    vrcomissao: 0,
    id_coleta: null,
    pneus: []
  });

  // Pneu Sub-Modal State
  const [isPneuModalOpen, setIsPneuModalOpen] = useState(false);
  const [editingPneuIndex, setEditingPneuIndex] = useState<number | null>(null);
  const [tempPneu, setTempPneu] = useState<OSPneu>({
    id_medida: 0,
    id_marca: 0,
    id_desenho: 0,
    id_servico: 0,
    id_recap: 0,
    numserie: '',
    dot: '',
    numfogo: '',
    valor: 0,
    statuspro: false,
    statusfat: false,
    statuspro_label: 'AGUARDANDO'
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeRef1 = useRef<SVGSVGElement>(null);
  const barcodeRef2 = useRef<SVGSVGElement>(null);

  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteSearchRef.current && !clienteSearchRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let timer: any;
    if (pneusForPrint.length > 0) {
      // Pequeno delay para garantir renderização dos SVGs antes de aplicar JsBarcode
      timer = setTimeout(() => {
        pneusForPrint.forEach(pneu => {
          const barcodeValue = String(pneu.id || 0).padStart(8, '0');
          try {
            JsBarcode(`.barcode-pneu-1-${pneu.id}`, barcodeValue, {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 10,
              margin: 0
            });
            JsBarcode(`.barcode-pneu-2-${pneu.id}`, barcodeValue, {
              format: "CODE128",
              width: 1.5,
              height: 35,
              displayValue: true,
              fontSize: 10,
              margin: 0
            });
          } catch (err) {
            console.error(`Erro ao gerar barcode para pneu ${pneu.id}:`, err);
          }
        });
      }, 150);
    }
    return () => clearTimeout(timer);
  }, [pneusForPrint]);

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

  useEffect(() => {
    if (location.state?.fromColeta && location.state?.coletaData) {
      const coleta = location.state.coletaData;
      console.log("Recebendo dados da coleta para gerar OS:", coleta);

      setFormData({
        numos: coleta.numos ? String(coleta.numos) : '',
        dataentrada: coleta.dataos ? new Date(coleta.dataos).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dataprevisao: (() => {
          if (!coleta.dataos) return '';
          const d = new Date(coleta.dataos);
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        })(),
        id_contato: coleta.id_contato || 0,
        id_vendedor: coleta.id_vendedor || 0,
        observacao: `Gerado a partir da coleta Mobile #${coleta.id}. ${coleta.msgmob || ''}`,
        status: 'ABERTA',
        id_coleta: coleta.id,
        pneus: (coleta.pneus || []).map((p: any) => {
          // Busca automática de serviço baseada em Medida, Desenho e Recap
          const matchedServico = servicos.find(s =>
            Number(s.id_medida) === Number(p.id_medida) &&
            Number(s.id_desenho) === Number(p.id_desenho) &&
            Number(s.id_recap) === Number(p.id_recap) &&
            s.ativo !== false
          );

          return {
            id_medida: p.id_medida,
            id_marca: p.id_marca,
            id_desenho: p.id_desenho,
            id_servico: matchedServico ? matchedServico.id : 0,
            id_recap: p.id_recap || 0,
            numserie: p.numserie || '',
            numfogo: p.numfogo || '',
            dot: p.dot || '',
            valor: p.valor || 0,
            statuspro: p.statuspro || false,
            statusfat: p.statusfat || false,
            statuspro_label: p.statuspro_label || 'AGUARDANDO',
            obs: p.obs || ''
          };
        })
      });
      setIsModalOpen(true);
      setModalMode('create');

      // Limpa o state para não reabrir ao atualizar a página
      window.history.replaceState({}, document.title);
    }
  }, [location, clientes, vendedores, servicos]);

  // Search Logic (Unified with Producao)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setSearchError('');

    try {
      let endpoint = '/ordens-servico/';
      let params = new URLSearchParams();

      if (searchParams.id) {
        // Se buscar por ID interno, pegamos direto
        const res = await api.get(`/ordens-servico/${searchParams.id}`);
        setOss([res.data]);
        return;
      }

      if (searchParams.numos || searchParams.cliente) {
        params.append('q', searchParams.numos || searchParams.cliente);
      }

      const response = await api.get(`${endpoint}?${params.toString()}`);
      setOss(response.data);

      if (response.data.length === 0) {
        setSearchError('Nenhum resultado encontrado para os filtros aplicados.');
      }
    } catch (err: any) {
      console.error("Erro na busca:", err);
      // Se for 404 no ID, tratamos
      if (err.response?.status === 404) {
        setOss([]);
        setSearchError('Ordem de Serviço não encontrada.');
      } else {
        const errorDetail = err.response?.data?.detail || err.message || 'Erro desconhecido';
        setSearchError(`Erro ao realizar a busca: ${errorDetail}`);
        console.error("Detalhes do erro na busca:", err.response?.data);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchParams({ ...searchParams, cliente: value, id: '', numos: '' });

    if (value.length >= 2) {
      const filtered = clientes.filter(c =>
        c.nome.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setFilteredClientes(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCliente = (clienteNome: string) => {
    setSearchParams({ ...searchParams, cliente: clienteNome, id: '', numos: '' });
    setShowSuggestions(false);

    // Dispara a busca automaticamente
    setTimeout(() => handleSearch(), 50);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await handleSearch();
    } catch (error) {
      console.error("Erro ao buscar OSs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    // Carregamento resiliente: se um falhar, os outros continuam
    const loadResource = async (path: string, setter: (data: any[]) => void, label: string) => {
      try {
        // Adiciona timestamp para evitar cache do navegador
        const timestamp = new Date().getTime();
        const sep = path.includes('?') ? '&' : '?';
        const response = await api.get(`${path}${sep}t=${timestamp}`);
        setter(response.data);
      } catch (error) {
        console.error(`Erro ao buscar ${label}:`, error);
      }
    };

    // Executa as buscas em paralelo, mas sem falhar o todo caso uma falte
    await Promise.allSettled([
      loadResource('/clientes/', setClientes, 'Clientes'),
      loadResource('/vendedores/', setVendedores, 'Vendedores'),
      loadResource('/transportadoras/', setTransportadoras, 'Transportadoras'),
      loadResource('/medidas/', setMedidas, 'Medidas'),
      loadResource('/produtos/', setProdutos, 'Produtos'),
      loadResource('/marcas/', setMarcas, 'Marcas'),
      loadResource('/desenhos/', setDesenhos, 'Desenhos'),
      loadResource('/servicos/', setServicos, 'Serviços'),
      loadResource('/tipo-recapagem/', setTiposRecap, 'Tipos de Recapagem'),
      loadResource('/planos-pagamento/', setPlanosPagamento, 'Planos de Pagamento'),
      loadResource('/regioes/', setRegioes, 'Regioes'),
      api.get('/empresas/').then(res => {
        if (res.data && res.data.length > 0) setEmpresa(res.data[0]);
      }).catch(err => console.error("Erro ao buscar empresa:", err))
    ]);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', os?: OrdemServico) => {
    setModalMode(mode);
    setFormError('');
    if ((mode === 'edit' || mode === 'view') && os) {
      setCurrentId(os.id);
      const clienteNome = clientes.find(c => c.id === os.id_contato)?.nome || '';
      setClienteSearchTerm(clienteNome);
      setFormData({
        numos: os.numos,
        dataprevisao: os.dataprevisao ? os.dataprevisao.split('T')[0] : '',
        id_contato: os.id_contato,
        id_vendedor: os.id_vendedor || 0,
        id_planopag: os.id_planopag || 0,
        observacao: os.observacao || os.obs_fatura || '',
        status: os.status,
        vrservico: os.vrservico || 0,
        vrtotal: os.vrtotal || 0,
        vrproduto: os.vrproduto || 0,
        vrcarcaca: os.vrcarcaca || 0,
        vrbonus: os.vrbonus || 0,
        vrmontagem: os.vrmontagem || 0,
        pcomissao: os.pcomissao || 0,
        vrcomissao: os.vrcomissao || 0,
        pneus: [...os.pneus]
      });
    } else {
      setCurrentId(null);
      setClienteSearchTerm('');
      setFormData({
        numos: '',
        dataprevisao: '',
        id_contato: 0,
        id_vendedor: 0,
        observacao: '',
        status: 'ABERTA',
        vrservico: 0,
        vrtotal: 0,
        vrproduto: 0,
        vrcarcaca: 0,
        vrbonus: 0,
        vrmontagem: 0,
        pcomissao: 0,
        vrcomissao: 0,
        id_coleta: null,
        pneus: []
      });
    }
    setIsModalOpen(true);
  };

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleClienteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClienteSearchTerm(value);
    
    if (value.length >= 3) {
      setShowClienteDropdown(true);
    } else {
      setShowClienteDropdown(false);
    }
  };

  const handleSelectCliente = (cliente: any) => {
    setClienteSearchTerm(cliente.nome);
    setShowClienteDropdown(false);
    setFormData((prev: any) => ({ 
      ...prev, 
      id_contato: cliente.id,
      id_vendedor: cliente.id_vendedor && cliente.id_vendedor !== 0 ? cliente.id_vendedor : prev.id_vendedor
    }));
  };

  const openPneuModal = (index: number | null) => {
    if (index !== null) {
      setEditingPneuIndex(index);
      setTempPneu({ ...formData.pneus[index] });
    } else {
      setEditingPneuIndex(null);
      setTempPneu({
        id_medida: 0,
        id_marca: 0,
        id_desenho: 0,
        id_servico: 0,
        id_recap: 0,
        numserie: '',
        numfogo: '',
        dot: '',
        valor: 0,
        statuspro: false,
        statusfat: false,
        statuspro_label: 'AGUARDANDO',
        codbarras: '',
        obs: ''
      });
    }
    setIsPneuModalOpen(true);
  };

  const savePneu = () => {
    const newPneus = [...formData.pneus];

    // Automatização do código de barras baseada no ID
    let finalPneu = { ...tempPneu };
    if (finalPneu.id && !finalPneu.codbarras) {
      finalPneu.codbarras = String(finalPneu.id).padStart(8, '0');
    }

    if (editingPneuIndex !== null) {
      newPneus[editingPneuIndex] = finalPneu;
    } else {
      newPneus.push(finalPneu);
    }
    setFormData((prev: any) => ({ ...prev, pneus: newPneus }));
    setIsPneuModalOpen(false);
  };

  const handleTempPneuChange = (field: string, value: any) => {
    setTempPneu(prev => ({ ...prev, [field]: value }));
  };

  const removePneu = (index: number) => {
    const newPneus = [...formData.pneus];
    newPneus.splice(index, 1);
    setSelectedPneus((prev) => prev.filter((i) => i !== index).map((i) => i > index ? i - 1 : i));
    setFormData((prev: any) => ({ ...prev, pneus: newPneus }));
  };

  const togglePneuSelection = (index: number) => {
    setSelectedPneus((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAllPneus = () => {
    if (selectedPneus.length === formData.pneus.length) {
      setSelectedPneus([]);
    } else {
      setSelectedPneus(formData.pneus.map((_: any, i: number) => i));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!formData.numos) errors.push("Número da OS não informado.");
    if (!formData.id_contato || formData.id_contato === "0" || formData.id_contato === 0) errors.push("Selecione um Cliente.");
    if (!formData.id_vendedor || formData.id_vendedor === "0" || formData.id_vendedor === 0) errors.push("Selecione um Vendedor.");

    if (!formData.pneus || formData.pneus.length === 0) {
      errors.push("Adicione ao menos um pneu à OS.");
    } else {
      formData.pneus.forEach((p: any, idx: number) => {
        const itemNum = idx + 1;
        if (!p.id_medida || p.id_medida === 0 || p.id_medida === "0") errors.push(`Pneu #${itemNum}: Medida não informada.`);
        if (!p.id_marca || p.id_marca === 0 || p.id_marca === "0") errors.push(`Pneu #${itemNum}: Marca não informada.`);
        if (!p.id_servico || p.id_servico === 0 || p.id_servico === "0") errors.push(`Pneu #${itemNum}: Serviço não informado.`);
      });
    }

    if (errors.length > 0) {
      setFormError(`PENDÊNCIAS:\n${errors.join('\n')}`);
      const body = document.querySelector('.modal-body.scrollable');
      if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload = {
      ...formData,
      numos: parseInt(formData.numos),
      id_contato: parseInt(formData.id_contato),
      id_vendedor: formData.id_vendedor && formData.id_vendedor !== "0" && formData.id_vendedor !== 0 ? parseInt(formData.id_vendedor) : null,
      id_planopag: formData.id_planopag && formData.id_planopag !== "0" && formData.id_planopag !== 0 ? parseInt(formData.id_planopag) : null,
      dataentrada: formData.dataentrada || null,
      dataprevisao: formData.dataprevisao || null,
      vrservico: parseFloat(formData.vrservico) || 0,
      vrtotal: parseFloat(formData.vrtotal) || 0,
      vrproduto: parseFloat(formData.vrproduto) || 0,
      vrcarcaca: parseFloat(formData.vrcarcaca) || 0,
      vrbonus: parseFloat(formData.vrbonus) || 0,
      vrmontagem: parseFloat(formData.vrmontagem) || 0,
      pcomissao: parseFloat(formData.pcomissao) || 0,
      vrcomissao: parseFloat(formData.vrcomissao) || 0,
      pneus: formData.pneus.map((p: any) => ({
        ...p,
        id_medida: p.id_medida && p.id_medida !== "0" && p.id_medida !== 0 ? parseInt(p.id_medida) : null,
        id_marca: p.id_marca && p.id_marca !== "0" && p.id_marca !== 0 ? parseInt(p.id_marca) : null,
        id_desenho: p.id_desenho && p.id_desenho !== "0" && p.id_desenho !== 0 ? parseInt(p.id_desenho) : null,
        id_servico: p.id_servico && p.id_servico !== "0" && p.id_servico !== 0 ? parseInt(p.id_servico) : null,
        id_recap: p.id_recap && p.id_recap !== "0" && p.id_recap !== 0 ? parseInt(p.id_recap) : null,
        valor: parseFloat(p.valor) || 0,
        statuspro: Boolean(p.statuspro),
        statusfat: Boolean(p.statusfat)
      }))
    };

    try {
      if (modalMode === 'create') {
        await api.post('/ordens-servico/', payload);
      } else if (modalMode === 'edit' && currentId !== null) {
        await api.put(`/ordens-servico/${currentId}`, payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Erro ao salvar Ordem de Serviço.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, numero: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a OS "${numero}"? Isso excluirá todos os pneus vinculados.`)) {
      try {
        await api.delete(`/ordens-servico/${id}`);
        await fetchData();
      } catch (err) {
        alert("Erro ao excluir OS.");
      }
    }
  };

  const handlePrintFicha = (pneu: any) => {
    setPneusForPrint([pneu]);
    document.body.classList.add('printing-os-active');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPneusForPrint([]);
        document.body.classList.remove('printing-os-active');
      }, 150);
    }, 700);
  };

  const handlePrintSelectedFichas = () => {
    const selectedData = formData.pneus.filter((_: any, idx: number) => selectedPneus.includes(idx));
    if (selectedData.length === 0) {
      alert("Selecione pelo menos um pneu para imprimir a ficha de produção.");
      return;
    }
    setPneusForPrint(selectedData);
    document.body.classList.add('printing-os-active');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPneusForPrint([]);
        document.body.classList.remove('printing-os-active');
      }, 150);
    }, 700);
  };
  
  const handlePrintOS = (os: OrdemServico) => {
    setOsToPrint(os);
    document.body.classList.add('printing-os-active');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setOsToPrint(null);
        document.body.classList.remove('printing-os-active');
      }, 300); // Aumentado para 300ms para maior estabilidade
    }, 700);
  };


  const handlePrintList = () => {
    document.body.classList.add('printing-os-list-active');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-os-list-active');
    }, 500);
  };

  return (
    <div className="os-container">
      <div className="print-header">
        <img src={logoEmpresa} alt="Logo Empresa" className="print-logo" />
        <h1 className="print-title">Ordem de Serviço</h1>
      </div>

      <div className="page-header">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <FileText size={32} color="var(--primary-color)" />
          Ordens de Serviço
        </h1>
        <div className="header-actions" translate="no">
          <button className="btn-print" onClick={handlePrintList}>
            <span><Printer size={20} /></span>
            <span>Imprimir Lista</span>
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <span><Plus size={20} /></span>
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      <div className="search-section-os glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <form onSubmit={handleSearch} className="search-form-producao">
          <div className="search-grid">
            <div className="form-group">
              <label><Hash size={14} /> ID Interno</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ex: 45"
                value={searchParams.id}
                onChange={(e) => setSearchParams({ ...searchParams, id: e.target.value, numos: '', cliente: '' })}
              />
            </div>
            <div className="form-group">
              <label><FileText size={14} /> Número da OS</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 5020"
                value={searchParams.numos}
                onChange={(e) => setSearchParams({ ...searchParams, numos: e.target.value, id: '', cliente: '' })}
              />
            </div>
            <div className="form-group span-2 relative">
              <label><User size={14} /> Nome do Cliente</label>
              <div className="input-with-button">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Busque pelo cliente..."
                  value={searchParams.cliente}
                  onChange={handleClienteChange}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <button type="submit" className="btn-search-producao" disabled={isSearching} translate="no">
                  {isSearching ? <span>Buscando...</span> : <><span><Search size={18} /></span> <span>Filtrar Lista</span></>}
                </button>
              </div>

              {showSuggestions && filteredClientes.length > 0 && (
                <div className="suggestions-dropdown glass-panel">
                  {filteredClientes.map(c => (
                    <div
                      key={c.id}
                      className="suggestion-item"
                      onClick={() => selectCliente(c.nome)}
                    >
                      <User size={14} className="icon" />
                      <span>{c.nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
        {searchError && <div className="search-error" style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>{searchError}</div>}
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="table-title-info">
            <Package size={20} />
            <h3>Listagem de Ordens de Serviço</h3>
            <span className="count-badge">{oss.length} registros</span>
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
                  <th>Número</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Total Itens</th>
                  <th>Valor Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(oss || []).length === 0 ? (
                  <tr><td colSpan={8} className="empty-state"><span>Nenhuma Ordem de Serviço encontrada.</span></td></tr>
                ) : (
                  (oss || []).map(os => {
                    try {
                      return (
                        <tr key={os.id}>
                          <td><span className="os-id">{os.id}</span></td>
                          <td><span className="os-number">#{os.numos}</span></td>
                          <td><span className="os-date">{os.dataentrada ? new Date(os.dataentrada).toLocaleDateString() : '-'}</span></td>
                          <td><span className="os-client">{(clientes || []).find(c => c.id === os.id_contato)?.nome?.trim() || 'Cliente não identificado'}</span></td>
                          <td>
                            <span className={`status-badge status-${(os.status || 'ABERTA').toLowerCase()}`}>
                              <span>{os.status || 'ABERTA'}</span>
                            </span>
                          </td>
                          <td><span className="os-pneus-count">{(os.pneus || []).length} pneus</span></td>
                          <td><span className="os-value">R$ {Number(os.vrtotal || 0).toFixed(2)}</span></td>
                          <td>
                            <div className="action-buttons" translate="no">
                              <button className="icon-btn success" onClick={() => openModal('view', os)} title="Visualizar" style={{ background: '#10b981' }}><span><Eye size={18} /></span></button>
                              <button className="icon-btn edit" onClick={() => openModal('edit', os)} title="Editar"><span><Edit2 size={16} /></span></button>
                              <button className="icon-btn delete" onClick={() => handleDelete(os.id, os.numos)} title="Excluir"><span><Trash2 size={16} /></span></button>
                            </div>
                          </td>
                        </tr>
                      );
                    } catch (renderErr) {
                      console.error("Erro ao renderizar linha da OS:", os.id, renderErr);
                      return <tr key={os.id}><td colSpan={8} style={{ color: 'red', fontSize: '0.8rem' }}>Erro nos dados da OS #{os.numos}</td></tr>;
                    }
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="os-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="premium-modal-content full-screen" onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Hash size={24} />
                <h2>{modalMode === 'create' ? 'Nova Ordem de Serviço' : modalMode === 'view' ? `Visualizar OS #${formData.numos}` : `Editar OS #${formData.numos}`}</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {(modalMode === 'edit' || modalMode === 'view') && (
                  <button type="button" className="btn-print" onClick={() => handlePrintOS(formData)}>
                    <Printer size={18} /> Imprimir OS
                  </button>
                )}
                <button type="button" className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable">
                <div className="premium-master-panel">
                  <div className="premium-section-title"><User size={18} /> Dados Principais e Cliente</div>
                  <div className="form-grid-os" style={{ gridTemplateColumns: '0.8fr 2.5fr 1fr 1fr' }}>
                    <div className="form-group">
                      <div className="input-with-icon">
                        <Hash size={18} className="field-icon" />
                        <label htmlFor="numos">Número da OS *</label>
                      </div>
                      <input className="form-input" id="numos" value={formData.numos} onChange={handleMasterChange} placeholder="Ex: 12345" required disabled={modalMode === 'view'} />
                    </div>

                    <div className="form-group" ref={clienteSearchRef} style={{ position: 'relative' }}>
                      <div className="input-with-icon">
                        <User size={18} className="field-icon" />
                        <label>Cliente *</label>
                      </div>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Digite 3 letras para buscar..." 
                        value={clienteSearchTerm} 
                        onChange={handleClienteSearchChange} 
                        disabled={modalMode === 'view'}
                        autoComplete="off"
                        required
                      />
                      {showClienteDropdown && clienteSearchTerm.length >= 3 && (
                        <div className="autocomplete-dropdown">
                          {clientes.filter(c => c.nome.toLowerCase().includes(clienteSearchTerm.toLowerCase())).length > 0 ? (
                            clientes.filter(c => c.nome.toLowerCase().includes(clienteSearchTerm.toLowerCase())).map(c => (
                              <div key={c.id} className="autocomplete-item" onClick={() => handleSelectCliente(c)}>
                                {c.nome}
                              </div>
                            ))
                          ) : (
                            <div className="autocomplete-item no-results">Nenhum cliente encontrado</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <div className="input-with-icon">
                        <Calendar size={18} className="field-icon" />
                        <label htmlFor="dataentrada">Data Entrada</label>
                      </div>
                      <input type="date" className="form-input" id="dataentrada" value={formData.dataentrada} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                    </div>

                    <div className="form-group">
                      <div className="input-with-icon">
                        <Calendar size={18} className="field-icon" />
                        <label htmlFor="dataprevisao">Previsão de Entrega</label>
                      </div>
                      <input type="date" className="form-input" id="dataprevisao" value={formData.dataprevisao} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label><Settings size={14} /> Status</label>
                      <select className="form-input" id="status" value={formData.status} onChange={handleMasterChange} disabled={modalMode === 'view'}>
                        <option value="ABERTA">ABERTA</option>
                        <option value="PRODUCAO">EM PRODUÇÃO</option>
                        <option value="FINALIZADA">FINALIZADA</option>
                        <option value="CANCELADA">CANCELADA</option>
                      </select>
                    </div>

                    <div className="form-group span-2">
                      <label>Vendedor</label>
                      <select className="form-input" id="id_vendedor" value={formData.id_vendedor} onChange={handleMasterChange} disabled={modalMode === 'view'}>
                        <option value="0">Sem vendedor</option>
                        {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                      </select>
                    </div>

                    <div className="form-group span-2">
                      <label>Plano de Pagamento</label>
                      <select className="form-input" id="id_planopag" value={formData.id_planopag} onChange={handleMasterChange} disabled={modalMode === 'view'}>
                        <option value="0">Selecione o plano...</option>
                        {planosPagamento.map(p => <option key={p.id} value={p.id}>{p.formapag}</option>)}
                      </select>
                    </div>
                    </div>
                </div>

                <div className="premium-master-panel">
                  <div className="premium-section-title"><Package size={18} /> Itens da OS (Pneus)</div>
                  <div className="os-detail-section">
                  <div className="section-title-bar">
                    <div className="title-left">
                      <Package size={18} />
                      <h3>Itens da OS (Pneus)</h3>
                      <span className="item-count">{formData.pneus.length} pneus adicionados</span>
                    </div>
                    <div className="title-right" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handlePrintSelectedFichas}
                        disabled={selectedPneus.length === 0}
                        style={{ opacity: selectedPneus.length === 0 ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
                        translate="no"
                      >
                        <span><Printer size={16} /></span> <span>Ficha de Produção</span>
                      </button>
                      {modalMode !== 'view' && (
                        <button type="button" className="btn-add-item" onClick={() => openPneuModal(null)}>
                          <Plus size={16} /> Adicionar Pneu
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pneus-grid-container">
                    <table className="pneus-table readonly">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>
                            <input
                              type="checkbox"
                              checked={selectedPneus.length === formData.pneus.length && formData.pneus.length > 0}
                              onChange={toggleAllPneus}
                            />
                          </th>
                          <th style={{ width: '60px' }}>ID</th>
                          <th>Medida / Marca</th>
                          <th>Desenho</th>
                          <th>Recapagem</th>
                          <th>Série / DOT / Fogo</th>
                          <th>Valor (R$)</th>
                          <th>Status Pro.</th>
                          <th>Status Fat.</th>
                          <th style={{ width: '100px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.pneus.length === 0 ? (
                          <tr><td colSpan={9} className="empty-pneus">Nenhum pneu adicionado a esta OS.</td></tr>
                        ) : (
                          formData.pneus.map((p: any, idx: number) => (
                            <tr key={idx}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedPneus.includes(idx)}
                                  onChange={() => togglePneuSelection(idx)}
                                />
                              </td>
                              <td style={{ fontWeight: 'bold', color: '#64748b', fontSize: '0.85rem' }}>{p.id || 'NEW'}</td>
                              <td>
                                <div className="pneu-info-cell">
                                  <span className="primary-info">{p.medida_nome || medidas.find(m => String(m.id) === String(p.id_medida))?.descricao || '---'}</span>
                                  <span className="secondary-info">{p.marca_nome || marcas.find(m => String(m.id) === String(p.id_marca))?.descricao || '---'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="pneu-info-cell">
                                  <span className="primary-info">
                                    {p.desenho_nome || desenhos.find(d => String(d.id) === String(p.id_desenho))?.descricao || '---'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ color: '#2563eb', fontWeight: '500' }}>{tiposRecap.find(tr => tr.id === parseInt(p.id_recap))?.descricao || '---'}</td>
                              <td>
                                <div className="serie-info" style={{ color: '#2563eb', fontWeight: '500' }}>
                                  <span>Série: {p.numserie || '-'}</span>
                                  <span>Fogo: {p.numfogo || '-'}</span>
                                  <span>DOT: {p.dot || '-'}</span>
                                </div>
                              </td>
                              <td className="valor-cell-readonly">R$ {parseFloat(p.valor).toFixed(2)}</td>
                              <td>
                                <div className="status-group-cell">
                                  {p.statuspro ? (
                                    <span className="status-badge-item status-processo" style={{ fontSize: '10px' }}>Produzido</span>
                                  ) : (
                                    <span className="status-badge-item status-aguardando" style={{ fontSize: '10px' }}>Aguardando</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="status-group-cell">
                                  {p.statusfat ? (
                                    <span className="status-badge-item status-pronto" style={{ fontSize: '10px' }}>Faturado</span>
                                  ) : (
                                    <span className="status-badge-item status-aguardando" style={{ fontSize: '10px' }}>Aguardando</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="action-buttons-inline">
                                  <button type="button" className="icon-btn print" onClick={() => handlePrintFicha(p)} title="Imprimir Ficha"><Printer size={16} /></button>
                                  <button type="button" className="icon-btn edit" onClick={() => openPneuModal(idx)} title={modalMode === 'view' ? "Visualizar" : "Editar"}>{modalMode === 'view' ? <Search size={16} /> : <Edit2 size={16} />}</button>
                                  {modalMode !== 'view' && <button type="button" className="icon-btn delete" onClick={() => removePneu(idx)} title="Excluir"><Trash2 size={16} /></button>}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid-summary-bar">
                    <div className="os-summary">
                      <div className="summary-item">
                        <span className="label">Total Itens</span>
                        <span className="value">{formData.pneus.length} pneu(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="financeiro-section" style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '12px',
                    border: '1px solid rgba(226, 232, 240, 0.8)'
                  }}>
                    <h3 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <DollarSign size={18} /> Resumo Financeiro da OS
                    </h3>
                    <div className="form-grid-os" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Vlr. Serviço</label>
                        <input type="number" step="0.01" className="form-input highlight-field" id="vrservico" value={formData.vrservico} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                      </div>
                      <div className="form-group">
                        <label>Vlr. Produto</label>
                        <input type="number" step="0.01" className="form-input" id="vrproduto" value={formData.vrproduto} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                      </div>
                      <div className="form-group">
                        <label>Vlr. Carcaça</label>
                        <input type="number" step="0.01" className="form-input" id="vrcarcaca" value={formData.vrcarcaca} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                      </div>
                      <div className="form-group">
                        <label>Vlr. Bônus</label>
                        <input type="number" step="0.01" className="form-input" id="vrbonus" value={formData.vrbonus} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                      </div>
                      <div className="form-group">
                        <label>Vlr. Montagem</label>
                        <input type="number" step="0.01" className="form-input" id="vrmontagem" value={formData.vrmontagem} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                      </div>
                      <div className="form-group">
                        <label>% Comissão</label>
                        <input type="number" step="0.01" className="form-input" id="pcomissao" value={formData.pcomissao} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                      </div>
                      <div className="form-group">
                        <label>Vlr. Comissão</label>
                        <input type="number" step="0.01" className="form-input" id="vrcomissao" value={formData.vrcomissao} onChange={handleMasterChange} disabled={modalMode === 'view'} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: '#0f172a', fontWeight: 'bold' }}>VALOR TOTAL FINAL</label>
                        <input type="number" step="0.01" className="form-input highlight-field" id="vrtotal" value={formData.vrtotal} onChange={handleMasterChange} style={{ fontWeight: 'bold', fontSize: '1.1rem' }} disabled={modalMode === 'view'} />
                      </div>
                    </div>
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
                    {isSubmitting ? 'Salvando...' : 'Salvar Ordem de Serviço'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {isPneuModalOpen && (
        <div className="modal-overlay sub-modal" onClick={() => setIsPneuModalOpen(false)}>
          <div className="modal-content pneu-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <Package className="header-icon" />
                <h2>{editingPneuIndex !== null ? 'Editar Detalhes do Pneu' : 'Adicionar Novo Pneu'}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsPneuModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="modal-body">
              <div className="pneu-form-grid">
                <div className="form-group span-2">
                  <label>Medida *</label>
                  <select className="form-input select-blue" value={tempPneu.id_medida} onChange={(e) => handleTempPneuChange('id_medida', e.target.value)} disabled={modalMode === 'view'}>
                    <option value="0">Selecione a medida...</option>
                    {medidas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Marca *</label>
                  <select className="form-input" value={tempPneu.id_marca} onChange={(e) => handleTempPneuChange('id_marca', e.target.value)} disabled={modalMode === 'view'}>
                    <option value="0">Selecione a marca...</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Desenho</label>
                  <select className="form-input select-blue" value={tempPneu.id_desenho} onChange={(e) => handleTempPneuChange('id_desenho', e.target.value)} disabled={modalMode === 'view'}>
                    <option value="0">Selecione o desenho...</option>
                    {desenhos.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Tipo de Recapagem</label>
                  <select className="form-input select-blue" value={tempPneu.id_recap} onChange={(e) => handleTempPneuChange('id_recap', e.target.value)} disabled={modalMode === 'view'}>
                    <option value="0">Selecione o tipo...</option>
                    {tiposRecap.map(tr => <option key={tr.id} value={tr.id}>{tr.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-4">
                  <label>Serviço Principal</label>
                  <select className="form-input" value={tempPneu.id_servico} onChange={(e) => handleTempPneuChange('id_servico', e.target.value)} disabled={modalMode === 'view'}>
                    <option value="0">Selecione o serviço...</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>DOT</label>
                  <input className="form-input uppercase" placeholder="Sem DOT" value={tempPneu.dot} onChange={(e) => handleTempPneuChange('dot', e.target.value.toUpperCase())} disabled={modalMode === 'view'} />
                </div>

                <div className="form-group">
                  <label htmlFor="numserie">Nº de Série</label>
                  <input className="form-input" id="numserie" value={tempPneu.numserie} onChange={(e) => handleTempPneuChange('numserie', e.target.value)} placeholder="Opcional" disabled={modalMode === 'view'} />
                </div>

                <div className="form-group">
                  <label>Número Fogo (Matrícula)</label>
                  <input className="form-input highlight-field" placeholder="0000" value={tempPneu.numfogo} onChange={(e) => handleTempPneuChange('numfogo', e.target.value)} disabled={modalMode === 'view'} />
                </div>

                <div className="form-group">
                  <label>Código de Barras</label>
                  <input className="form-input highlight-field" placeholder="Opcional (Auto ID)" value={tempPneu.codbarras} onChange={(e) => handleTempPneuChange('codbarras', e.target.value)} disabled={modalMode === 'view'} />
                </div>

                <div className="form-group">
                  <label>Valor do Serviço (R$)</label>
                  <div className="input-with-icon">
                    <DollarSign size={16} className="field-icon" />
                    <input className="form-input" type="number" step="0.01" value={tempPneu.valor} onChange={(e) => handleTempPneuChange('valor', e.target.value)} disabled={modalMode === 'view'} />
                  </div>
                </div>

                <div className="form-group span-2">
                  <label>Controles de Produção</label>
                  <div className="checkbox-group" style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tempPneu.statuspro}
                        onChange={(e) => handleTempPneuChange('statuspro', e.target.checked)}
                        disabled={modalMode === 'view'}
                      />
                      Produzido ?
                    </label>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tempPneu.statusfat}
                        onChange={(e) => handleTempPneuChange('statusfat', e.target.checked)}
                        disabled={modalMode === 'view'}
                      />
                      Faturado ?
                    </label>
                  </div>
                </div>

                <div className="form-group span-2">
                  <label>Observação do Pneu</label>
                  <input className="form-input" placeholder="Opcional" value={tempPneu.obs} onChange={(e) => handleTempPneuChange('obs', e.target.value)} disabled={modalMode === 'view'} />
                </div>
              </div>
            </div>

            <div className="footer-btns">
              {modalMode === 'view' ? (
                <button type="button" className="btn-secondary" onClick={() => setIsPneuModalOpen(false)}>Fechar Detalhes</button>
              ) : (
                <>
                  <button type="button" className="btn-secondary" onClick={() => setIsPneuModalOpen(false)}>Cancelar</button>
                  <button type="button" className="btn-primary" onClick={savePneu}>
                    {editingPneuIndex !== null ? 'Atualizar Pneu' : 'Confirmar Pneu'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div id="print-fichas-section">
        {pneusForPrint.length > 0 && (
          <div className="printable-ficha-container">
            {pneusForPrint.map((p, idx) => (
              <div key={p.id || idx} className="printable-ficha-page">
                {/* CARTÃO 1: ACOMPANHAMENTO DO PNEU */}
                <div className="ficha-card">
                  <div className="ficha-header">
                    <div className="header-logo"><img src={logoEmpresa} alt="LOGO" /></div>
                    <div className="header-center-title">CARTÃO DE ACOMPANHAMENTO DO PNEU</div>
                    <div className="header-id-grid">
                      <div className="id-box"><span className="id-label">Usuário</span><span className="id-value">ADMIN</span></div>
                      <div className="id-box no-right"><span className="id-label">ID Pneu</span><span className="id-value">{p.id || '---'}</span></div>
                      <div className="id-box"><span className="id-label">Data Entrada</span><span className="id-value">{formData.dataentrada ? new Date(formData.dataentrada).toLocaleDateString() : '___/___/___'}</span></div>
                      <div className="id-box no-right"><span className="id-label">Data Entrega</span><span className="id-value">___/___/___</span></div>
                      <div className="id-box">
                        <span className="id-label">Região</span>
                        <span className="id-value">
                          {(() => {
                            const cliente = clientes.find(c => c.id === parseInt(formData.id_contato));
                            const reg = regioes.find(r => r.id === cliente?.id_regiao);
                            return reg?.codigo || '---';
                          })()}
                        </span>
                      </div>
                      <div className="id-box no-right"><span className="id-label">Desenho Original</span><span className="id-value">{p.desenhoriginal || '---'}</span></div>
                    </div>
                  </div>

                  <div className="full-row-field" style={{ borderBottom: '1px solid #000', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: 2 }}>
                      <span className="id-label">Cliente</span>
                      <span className="id-value">{clientes.find(c => String(c.id) === String(formData.id_contato))?.nome || '---'}</span>
                    </div>
                    <div style={{ flex: 1, borderLeft: '1px solid #000', paddingLeft: '5px' }}>
                      <span className="id-label">Cidade</span>
                      <span className="id-value">{clientes.find(c => String(c.id) === String(formData.id_contato))?.cidade || '---'}</span>
                    </div>
                  </div>

                  <div className="technical-row">
                    <div className="id-box"><span className="id-label">Bitola / Medida</span><span className="id-value">{medidas.find(m => m.id === parseInt(p.id_medida))?.descricao || '---'}</span></div>
                    <div className="id-box"><span className="id-label">Marca</span><span className="id-value">{marcas.find(m => m.id === parseInt(p.id_marca))?.descricao || '---'}</span></div>
                    <div className="id-box"><span className="id-label">Matrícula / Série</span><span className="id-value">{p.numserie || '---'}</span></div>
                    <div className="id-box"><span className="id-label">Nº Fogo</span><span className="id-value">{p.numfogo || '---'}</span></div>
                    <div className="id-box no-right"><span className="id-label">DOT</span><span className="id-value">{p.dot || '---'}</span></div>
                  </div>

                  <div className="ficha-main-area">
                    <div className="production-table-area">
                      <table className="prod-table">
                        <thead>
                          <tr>
                            <th className="sector-name">SETOR</th>
                            <th style={{ width: '100px' }}>ASSINATURA</th>
                            <th style={{ width: '40px' }}>EQ.</th>
                            <th>D E S C R I Ç Ã O</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td className="sector-name">EXAME PRELIMINAR</td><td></td><td></td><td><div className="sub-field-group"><span>OBS:</span><div className="sub-field-item"><div className="mini-box"></div> <span>CONSERTO ANTERIOR</span></div></div></td></tr>
                          <tr><td className="sector-name">RASPAGEM</td><td></td><td></td><td><div className="sub-field-group"><span>PERÍMETRO:</span><span>RAIO:</span><span>LARGURA DO PISO:</span></div></td></tr>
                          <tr><td className="sector-name">ESCAREAÇÃO</td><td></td><td></td><td><div className="sub-field-group"><div className="sub-field-item"><div className="mini-box"></div> <span>NORMAL</span></div><div className="sub-field-item"><div className="mini-box"></div> <span>ABERTURA CANALETA</span></div></div><div className="sub-field-group"><div className="sub-field-item"><div className="mini-box"></div> <span>EXCESSO</span></div><div className="sub-field-item"><div className="mini-box"></div> <span>RETIRADA 4ª CINTA</span></div></div></td></tr>
                          <tr><td className="sector-name">REEXAME / PREP. CONSERTO</td><td></td><td></td><td><span className="id-label">TIPO E QUANTIDADE</span></td></tr>
                          <tr><td className="sector-name">APLICAÇÃO DE COLA</td><td></td><td></td><td><div style={{ textAlign: 'right', fontSize: '6pt' }}>HORAS _______</div></td></tr>
                          <tr><td className="sector-name">CORTE DE BANDA</td><td></td><td></td><td></td></tr>
                          <tr><td className="sector-name">PREENCHIMENTO APLIC. MANCHÃO</td><td></td><td></td><td></td></tr>
                          <tr><td className="sector-name">COBERTURA</td><td></td><td></td><td><div className="sub-field-group"><span>PERÍMETRO ________ M.M.</span><span>LOTE/BANDA ___________________</span></div></td></tr>
                          <tr><td className="sector-name">VULCANIZAÇÃO PRENSA</td><td></td><td></td><td><div className="sub-field-group"><span>INÍCIO: _________</span><span>FINAL: _________</span><span>HORAS: _________</span></div></td></tr>
                          <tr><td className="sector-name">VULCANIZAÇÃO AUTOCLAVE</td><td></td><td></td><td><div className="sub-field-group"><span>INÍCIO: _________</span><span>FINAL: _________</span><span style={{ marginLeft: '10px' }}>S [ ] E [ ] B [ ]</span></div></td></tr>
                          <tr><td className="sector-name">EXAME FINAL ACABAMENTO</td><td></td><td></td><td><div className="sub-field-group"><span>DATA: ___/___/___</span><div className="sub-field-item"><div className="mini-box"></div> <span>APROVADO</span></div><div className="sub-field-item"><div className="mini-box"></div> <span>REPROVADO</span></div></div></td></tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="side-panel">
                      <div className="side-item">
                        <span className="id-label">DESENHO DA REFORMA</span>
                        <span className="id-value">
                          {p.desenho_nome || desenhos.find(d => String(d.id) === String(p.id_desenho))?.descricao || '---'}
                        </span>
                      </div>
                      <div className="side-item check"><div className="mini-box"></div> <span>RECAPAGEM</span></div>
                      <div className="side-item check"><div className="mini-box"></div> <span>RECAUCHUTAGEM</span></div>
                      <div className="side-item check"><div className="mini-box"></div> <span>VULCANIZAÇÃO</span></div>
                      <div className="side-item check"><div className="mini-box"></div> <span>RECUSADO</span></div>
                      <div className="side-item check"><div className="mini-box"></div> <span>APROVADO</span></div>
                      <div className="side-item check"><div className="mini-box"></div> <span>APROVADO S.G.</span></div>
                      <div className="side-item" style={{ flex: 1, textAlign: 'center', fontSize: '6pt', display: 'flex', alignItems: 'center' }}>CARIMBO DE GARANTIA / RECUSA</div>
                      <div className="barcode-area">
                        <svg className={`barcode-pneu-1-${p.id}`}></svg>
                      </div>
                    </div>
                  </div>

                  <div className="obs-area">
                    <span className="id-label">OBSERVAÇÃO:</span>
                  </div>
                </div>

                {/* CARTÃO 2: MOTIVOS DE RECUSA / NÃO GARANTIA */}
                <div className="ficha-card recusa-card">
                  <div className="ficha-header">
                    <div className="header-logo"><img src={logoEmpresa} alt="LOGO" /></div>
                    <div className="header-center-title" style={{ fontSize: '13pt' }}>CARTÃO DE ACOMPANHAMENTO DO PNEU</div>
                    <div className="header-id-grid" style={{ width: '200px' }}>
                      <div className="id-box"><span className="id-label">ID Pneu</span><span className="id-value">{p.id || '---'}</span></div>
                      <div className="id-box no-right"><span className="id-label">Usuário</span><span className="id-value">ADMIN</span></div>
                      <div className="id-box no-bottom"><span className="id-label">Região</span><span className="id-value">{(() => { const cliente = clientes.find(c => c.id === parseInt(formData.id_contato)); const reg = regioes.find(r => r.id === cliente?.id_regiao); return reg?.codigo || '---'; })()}</span></div>
                      <div className="id-box no-right no-bottom"><span className="id-label">Data</span><span className="id-value">{new Date().toLocaleDateString()}</span></div>
                    </div>
                  </div>

                  <div className="recusa-main-grid">
                    <div className="recusa-fields">
                      <div className="id-box" style={{ borderRight: 'none' }}><span className="id-label">Cliente</span><span className="id-value">{clientes.find(c => c.id === parseInt(formData.id_contato))?.nome || '---'}</span></div>
                      <div className="technical-row" style={{ gridTemplateColumns: '1.5fr 1.5fr', borderRight: 'none' }}>
                        <div className="id-box" style={{ borderBottom: 'none' }}>
                          <span className="id-label">Cidade</span>
                          <span className="id-value">{clientes.find(c => String(c.id) === String(formData.id_contato))?.cidade || '---'}</span>
                        </div>
                        <div className="id-box" style={{ borderRight: 'none', borderBottom: 'none' }}>
                          <span className="id-label">Desenho da Reforma</span>
                          <span className="id-value">
                            {p.desenho_nome || desenhos.find(d => String(d.id) === String(p.id_desenho))?.descricao || '---'}
                          </span>
                        </div>
                      </div>
                      <div className="id-box" style={{ borderTop: '1px solid #000', borderRight: 'none' }}><span className="id-label">Bitola / Medida</span><span className="id-value">{medidas.find(m => m.id === parseInt(p.id_medida))?.descricao || '---'}</span></div>
                      <div className="id-box no-bottom" style={{ borderRight: 'none' }}><span className="id-label">Série</span><span className="id-value">{p.numserie || '---'}</span></div>
                      <div className="obs-area" style={{ borderTop: '1px solid #000' }}>
                        <span className="id-label">OBSERVAÇÃO:</span>
                      </div>
                    </div>

                    <div className="motivos-panel">
                      <div className="motivo-header">( X ) MOTIVO DA RECUSA ( ) NÃO GARANTIA</div>
                      <div className="motivos-area">
                        {[
                          'EXCESSO DE CONSERTOS', 'EXCESSO DE PICOTAMENTOS', 'DESLOCAMENTO ENTRE LONAS',
                          'DESGASTE EXCESSIVO', 'RODAGEM COM BAIXA PRESSÃO', 'NUMEROSOS RACHOS RADIAIS',
                          'DETERIORIZAÇÃO DO TALÃO', 'CONTAMINAÇÃO COM ÓLEO OU GRAXA', 'OUTROS'
                        ].map(m => (
                          <div key={m} className="motivo-item"><div className="mini-box"></div> <span>{m}</span></div>
                        ))}
                      </div>
                      <div className="barcode-area" style={{ borderTop: '1px solid #000', height: '45px' }}>
                        <svg className={`barcode-pneu-2-${p.id}`}></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="print-os-section">
        {osToPrint && (
          <div className="print-os-wrapper">
            <div className="os-print-header">
              <div className="os-print-logo">
                <img src={logoEmpresa} alt="Logo" />
              </div>
              <div className="os-print-company-info">
                <div><strong>{empresa?.razaosocial || 'TOTALCAP RECAPAGEM'}</strong></div>
                <div>CNPJ: {empresa?.cnpj || '00.000.000/0000-00'}</div>
                <div>Fone: {empresa?.telefone || '(00) 0000-0000'}</div>
                <div>{empresa?.rua || 'Rua da Recapagem'}, {empresa?.numcasa || '100'}</div>
                <div>{empresa?.cidade || 'Cidade'} - {empresa?.uf || 'UF'}</div>
              </div>
            </div>

            <div className="os-print-title-area">
              <h2>Ordem de Serviço</h2>
              <div style={{ fontSize: '14pt', fontWeight: 700 }}>Nº {osToPrint.numos}</div>
            </div>

            <div className="os-print-info-grid">
              <div className="info-box">
                <div><strong>Cliente:</strong> {clientes.find(c => c.id === osToPrint.id_contato)?.nome || '---'}</div>
                <div><strong>CPF/CNPJ:</strong> {clientes.find(c => c.id === osToPrint.id_contato)?.cpfcnpj || '---'}</div>
                <div><strong>Endereço:</strong> {clientes.find(c => c.id === osToPrint.id_contato)?.rua || '---'}, {clientes.find(c => c.id === osToPrint.id_contato)?.numcasa || ''}</div>
                <div><strong>Cidade:</strong> {clientes.find(c => String(c.id) === String(osToPrint.id_contato))?.cidade || '---'} - {clientes.find(c => String(c.id) === String(osToPrint.id_contato))?.uf || '--'}</div>
              </div>
              <div className="info-box">
                <div><strong>Data Entrada:</strong> {osToPrint.dataentrada ? new Date(osToPrint.dataentrada).toLocaleDateString('pt-BR') : '---'}</div>
                <div><strong>Previsão:</strong> {osToPrint.dataprevisao ? new Date(osToPrint.dataprevisao).toLocaleDateString('pt-BR') : '---'}</div>
                <div><strong>Vendedor:</strong> {vendedores.find(v => v.id === osToPrint.id_vendedor)?.nome || '---'}</div>
                <div><strong>Status:</strong> {osToPrint.status}</div>
              </div>
            </div>

            <table className="os-print-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Medida</th>
                  <th>Marca / Desenho</th>
                  <th>Serviço</th>
                  <th>Série / Fogo</th>
                  <th style={{ textAlign: 'right' }}>V. Unit</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {osToPrint.pneus.map((p, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{medidas.find(m => m.id === p.id_medida)?.descricao || '---'}</td>
                    <td>{p.marca_nome || marcas.find(m => String(m.id) === String(p.id_marca))?.descricao || '-'} / {p.desenho_nome || desenhos.find(d => String(d.id) === String(p.id_desenho))?.descricao || '-'}</td>
                    <td>{servicos.find(s => s.id === p.id_servico)?.descricao || '---'}</td>
                    <td>{p.numserie || '-'} / {p.numfogo || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}</td>
                    <td style={{ textAlign: 'right' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="os-print-totals">
              <div className="totals-grid">
                <div className="total-row">
                  <span>Total Itens:</span>
                  <span>{osToPrint.pneus.length}</span>
                </div>
                <div className="total-row">
                  <span>Sub-Total:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(osToPrint.pneus.reduce((acc, curr) => acc + (curr.valor || 0), 0))}</span>
                </div>
                <div className="total-row">
                  <span>Total OS:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(osToPrint.pneus.reduce((acc, curr) => acc + (curr.valor || 0), 0))}</span>
                </div>
              </div>
            </div>

            <div className="os-print-obs">
              <strong>Observações:</strong>
              <p style={{ margin: '5px 0', fontSize: '10pt' }}>{osToPrint.observacao || 'Nenhuma observação informada.'}</p>
            </div>

            <div className="os-print-signatures">
              <div className="sig-box">RESPONSÁVEL TÉCNICO</div>
              <div className="sig-box">ASSINATURA DO CLIENTE</div>
            </div>
            
            <div style={{ marginTop: '30px', fontSize: '8pt', textAlign: 'center', color: '#666' }}>
              Este documento é apenas para controle interno e conferência de serviços.
            </div>
          </div>
        )}
      </div>

      {/* RELATÓRIO DE LISTA - Layout de Qualidade */}
      <div className="report-list-container only-print">
        <div className="report-list-header">
          <div className="report-header-main">
            <div className="report-logo-box">
              <img src={logoEmpresa} alt="Logo" />
            </div>
            <div className="report-company-info">
              <h2>{empresa?.razaosocial || 'TOTALCAP GESTÃO DE PNEUS'}</h2>
              <p className="company-subtitle">Sistema de Gestão de Recapagem de Pneus</p>
            </div>
            <div className="report-meta-info">
              <div className="meta-item">
                <span className="meta-label">Data:</span>
                <span className="meta-value">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Hora:</span>
                <span className="meta-value">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          
          <div className="report-title-bar">
            <h1>RELATÓRIO DE ORDENS DE SERVIÇO</h1>
            <div className="report-filter-info">
              {searchParams.numos || searchParams.cliente || searchParams.id ? `Filtros Aplicados` : 'Filtro: Todos os registros'}
            </div>
          </div>
        </div>

        <table className="report-modern-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th style={{ width: '100px' }}>Número OS</th>
              <th style={{ width: '110px' }}>Data</th>
              <th>Cliente</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Itens</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Valor Total</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {oss.map((os: any) => (
              <tr key={os.id}>
                <td className="cell-id">#{os.id}</td>
                <td className="cell-os">#{os.numos}</td>
                <td>{os.dataentrada ? new Date(os.dataentrada).toLocaleDateString('pt-BR') : '---'}</td>
                <td className="cell-client">{clientes.find(c => c.id === os.id_contato)?.nome || '---'}</td>
                <td style={{ textAlign: 'center' }}>{os.pneus?.length || 0}</td>
                <td className="cell-value">R$ {parseFloat(os.vrtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="cell-status">
                  <span className={`status-pill ${String(os.status || '').toLowerCase()}`}>
                    {os.status || 'ABERTA'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="footer-label">VALOR TOTAL ACUMULADO:</td>
              <td className="footer-value">
                R$ {oss.reduce((acc: number, curr: any) => acc + (parseFloat(curr.vrtotal) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="footer-count">{oss.length} registro(s)</td>
            </tr>
          </tfoot>
        </table>
        
        <div className="report-list-footer">
          <span>Documento gerado pelo Sistema Totalcap em {new Date().toLocaleString('pt-BR')}</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
}

