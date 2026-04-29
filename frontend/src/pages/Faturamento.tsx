import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Search, Printer, DollarSign, FileText, 
  Calculator, Hash, User, Package, ChevronRight,
  TrendingUp, CheckCircle, Clock, Plus, Trash2, X, Settings, Activity, Wrench, Calendar, Home, Book, Edit, Eye
} from 'lucide-react';
import api from '../lib/api';
import './Faturamento.css';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface PneuSearchResult {
  pneu_id: number;
  numserie: string;
  numfogo: string;
  dot: string;
  statuspro: boolean;
  statusfat: boolean;
  statuspro_label: string;
  medida_nome: string;
  produto_nome: string;
  desenho_nome: string;
  servico_nome: string;
  os_id: number;
  numos: number;
  contato_nome: string;
  dataentrada: string;
  id_servico_base: number;
  valor_pneu: number;
  tiporecap_nome: string;
  qservico: number;
  vrservico: number;
  id_vendedor?: number;
  id_contato?: number;
}

export default function Faturamento() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'informe' | 'calculo' | 'faturas'>('informe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [empresa, setEmpresa] = useState<any>(null);

  // Aba 1: Informe de Serviços (Busca por Pneu)
  const [pneuSearchQuery, setPneuSearchQuery] = useState('');
  const [pneuResults, setPneuResults] = useState<PneuSearchResult[]>([]);
  const [selectedFaturaIds, setSelectedFaturaIds] = useState<number[]>([]);

  // Aba 2: Cálculo de Fatura (Busca por OS - Igual Produção)
  const [searchParams, setSearchParams] = useState({ id: '', numos: '', cliente: '', id_pneu: '' });
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);
  const [tiposDocto, setTiposDocto] = useState<any[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [osResults, setOsResults] = useState<any[]>([]);
  
  // Estado para Serviços Adicionais (CRUD)
  const [pneuServicos, setPneuServicos] = useState<any[]>([]);
  const [isServicoModalOpen, setIsServicoModalOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<any | null>(null);
  const [allServicos, setAllServicos] = useState<any[]>([]);
  const [newServico, setNewServico] = useState({ id_servico: 0, quant: 1, valor: 0 });
  const [servicoSearchQuery, setServicoSearchQuery] = useState('');
  const [showServicoSuggestions, setShowServicoSuggestions] = useState(false);

  // Estados para Cálculo de Fatura
  const [selectedOSForBilling, setSelectedOSForBilling] = useState<any | null>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [allPlanosPag, setAllPlanosPag] = useState<any[]>([]);
  const [billingFinancials, setBillingFinancials] = useState({
    vrservico: 0,
    vrproduto: 0,
    vrcarcaca: 0,
    vrbonus: 0,
    vrmontagem: 0,
    id_planopag: 0
  });

  // Aba 3: Gerenciar Faturas (CRUD)
  const [faturas, setFaturas] = useState<any[]>([]);
  const [selectedFatura, setSelectedFatura] = useState<any | null>(null);
  const [faturaSearchQuery, setFaturaSearchQuery] = useState('');
  const [isFaturaModalOpen, setIsFaturaModalOpen] = useState(false);
  const [editingFatura, setEditingFatura] = useState<any | null>(null);
  const [faturaLoading, setFaturaLoading] = useState(false);
  const [faturaModalMode, setFaturaModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [activeFaturaModalTab, setActiveFaturaModalTab] = useState<'pneus' | 'dados'>('pneus');
  const [selectedPneusForFatura, setSelectedPneusForFatura] = useState<number[]>([]);
  const [pneuServicosPreview, setPneuServicosPreview] = useState<any[]>([]);
  const [faturaParcelasPreview, setFaturaParcelasPreview] = useState<any[]>([]);
  const [isEditParcelaModalOpen, setIsEditParcelaModalOpen] = useState(false);
  const [editingParcelaIndex, setEditingParcelaIndex] = useState<number | null>(null);
  const [editingParcelaData, setEditingParcelaData] = useState<any>({ num_parcela: 0, vencto: '', valor: 0, id_tipodocto: null });
  
  // Estados para Laudos na Fatura
  const [faturaLaudosPreview, setFaturaLaudosPreview] = useState<any[]>([]);
  const [isLaudoModalOpen, setIsLaudoModalOpen] = useState(false);
  const [laudoSearchQuery, setLaudoSearchQuery] = useState('');
  const [laudoSuggestions, setLaudoSuggestions] = useState<any[]>([]);
  const [showLaudoSuggestions, setShowLaudoSuggestions] = useState(false);
  const [faturaToPrint, setFaturaToPrint] = useState<any | null>(null);
  const [selectedLaudoForLinking, setSelectedLaudoForLinking] = useState<any>(null);
  const [linkingLaudoValue, setLinkingLaudoValue] = useState<number>(0);
  const [showClientLaudosList, setShowClientLaudosList] = useState(false);
  const [clientLaudos, setClientLaudos] = useState<any[]>([]);

  const [faturaForm, setFaturaForm] = useState<any>({
    id_contato: null,
    cliente_nome: '',
    id_planopag: null,
    id_vendedor: null,
    id_banco: null,
    id_tipodocto: null,
    obs: '',
    datafat: new Date().toISOString().split('T')[0],
    vrservico: 0,
    vrproduto: 0,
    vrcarcaca: 0,
    vrmontagem: 0,
    vrbonus: 0,
    vrtotal: 0
  });

  useEffect(() => {
    fetchClientes();
    fetchVendedores();
    fetchBancos();
    fetchTiposDocto();
    fetchMasterServicos();
    fetchPlanosPag();
    if (activeTab === 'faturas') {
      fetchFaturas();
    }
  }, [activeTab]);

  useEffect(() => {
    api.get('/empresas/').then(res => {
      if (res.data && res.data.length > 0) setEmpresa(res.data[0]);
    }).catch(err => console.error("Erro ao buscar empresa:", err));
  }, []);

  const handlePrintList = () => {
    document.body.classList.add('printing-fatura-list-active');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-fatura-list-active');
      }, 500);
    }, 50);
  };

  const handlePrintSingleFatura = (fatura: any) => {
    // Se estivermos editando, precisamos garantir que temos os dados atuais
    // Mas geralmente o 'editingFatura' já tem o que precisamos ou está no 'faturaForm'
    
    // Preparar objeto para impressão unificando dados
    const dataToPrint = {
      ...fatura,
      ...faturaForm,
      pneus: pneuServicosPreview,
      parcelas: faturaParcelasPreview,
      laudos: faturaLaudosPreview
    };

    setFaturaToPrint(dataToPrint);
    document.body.classList.add('printing-single-fatura-active');
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setFaturaToPrint(null);
        document.body.classList.remove('printing-single-fatura-active');
      }, 500);
    }, 100);
  };

  const fetchBancos = async () => {
    try {
      const response = await api.get('/bancos/');
      setBancos(response.data);
    } catch (err) {
      console.error("Erro ao buscar bancos", err);
    }
  };

  const fetchTiposDocto = async () => {
    try {
      const response = await api.get('/tipos-docto/');
      setTiposDocto(response.data);
    } catch (err) {
      console.error("Erro ao buscar tipos de documento", err);
    }
  };

  const fetchVendedores = async () => {
    try {
      const response = await api.get('/vendedores/');
      setVendedores(response.data);
    } catch (err) {
      console.error("Erro ao buscar vendedores", err);
    }
  };

  const fetchPlanosPag = async () => {
    try {
      const response = await api.get('/planos-pagamento/');
      setAllPlanosPag(response.data);
    } catch (err) {
      console.error("Erro ao buscar planos de pagamento", err);
    }
  };

  const openBillingModal = (os: any) => {
    setSelectedOSForBilling(os);
    setBillingFinancials({
      vrservico: parseFloat(os.vrservico || 0),
      vrproduto: parseFloat(os.vrproduto || 0),
      vrcarcaca: parseFloat(os.vrcarcaca || 0),
      vrbonus: parseFloat(os.vrbonus || 0),
      vrmontagem: parseFloat(os.vrmontagem || 0),
      id_planopag: os.id_planopag || 0
    });
    setIsBillingModalOpen(true);
  };

  const calculateBillingTotal = () => {
    const f = billingFinancials;
    return (f.vrservico + f.vrproduto + f.vrcarcaca + f.vrmontagem) - f.vrbonus;
  };

  const handleFinalizeBilling = async () => {
    if (!selectedOSForBilling) return;
    if (billingFinancials.id_planopag === null || billingFinancials.id_planopag === undefined) {
      alert("Selecione um Plano de Pagamento");
      return;
    }

    try {
      const total = calculateBillingTotal();
      
      // 1. Criar a Fatura
      const faturaPayload = {
        id_contato: selectedOSForBilling.id_contato || selectedOSForBilling.contato?.id,
        id_planopag: parseInt(billingFinancials.id_planopag.toString()),
        vrservico: billingFinancials.vrservico,
        vrproduto: billingFinancials.vrproduto,
        vrcarcaca: billingFinancials.vrcarcaca,
        vrbonus: billingFinancials.vrbonus,
        vrmontagem: billingFinancials.vrmontagem,
        vrtotal: total,
        obs: selectedOSForBilling.obs_fatura || '',
        pneu_ids: (selectedOSForBilling.pneus || []).map((p: any) => p.id)
      };

      await api.post('/faturas/', faturaPayload);

      // 2. Atualizar o Status da OS para Finalizada
      const osUpdatePayload = {
      };
      await api.put(`/ordens-servico/${selectedOSForBilling.id}`, osUpdatePayload);

      alert("Faturamento finalizado e Fatura gerada com sucesso!");
      setIsBillingModalOpen(false);
      handleOSSearch(new Event('submit') as any); // Refresh OS list
    } catch (err) {
      console.error("Erro ao finalizar faturamento", err);
      alert("Erro ao finalizar faturamento.");
    }
  };

  const fetchFaturas = async () => {
    try {
      setFaturaLoading(true);
      let url = '/faturas/';
      if (faturaSearchQuery) {
        url += `?q=${encodeURIComponent(faturaSearchQuery)}`;
      }
      const response = await api.get(url);
      setFaturas(response.data);
    } catch (err) {
      console.error("Erro ao buscar faturas", err);
    } finally {
      setFaturaLoading(false);
    }
  };

  const handleDeleteFatura = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta fatura? Os pneus retornarão ao status de pendentes.")) return;
    try {
      await api.delete(`/faturas/${id}`);
      fetchFaturas();
      setSelectedFaturaIds(prev => prev.filter(fid => fid !== id));
    } catch (err) {
      alert("Erro ao excluir fatura.");
    }
  };

  const handleToggleFaturaSelection = (id: number) => {
    setSelectedFaturaIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleSelectAllFaturas = () => {
    if (selectedFaturaIds.length === faturas.length) {
      setSelectedFaturaIds([]);
    } else {
      setSelectedFaturaIds(faturas.map(f => f.id));
    }
  };

  const handleOpenFaturaModal = async (fatura?: any, mode: 'create' | 'edit' | 'view' = 'create') => {
    setFaturaModalMode(mode);
    if (fatura) {
      setEditingFatura(fatura);
      setFaturaForm({
        id_contato: fatura.id_contato,
        cliente_nome: fatura.contato_nome || '',
        id_planopag: fatura.id_planopag,
        id_vendedor: fatura.id_vendedor,
        id_banco: fatura.id_banco,
        id_tipodocto: fatura.id_tipodocto,
        obs: fatura.obs || '',
        datafat: (fatura.datafat || new Date().toISOString()).split('T')[0],
        vrservico: parseFloat(fatura.vrservico || 0),
        vrproduto: parseFloat(fatura.vrproduto || 0),
        vrcarcaca: parseFloat(fatura.vrcarcaca || 0),
        vrmontagem: parseFloat(fatura.vrmontagem || 0),
        vrbonus: parseFloat(fatura.vrbonus || 0),
        vrtotal: parseFloat(fatura.vrtotal || 0)
      });
      setSelectedPneusForFatura(fatura.pneus?.map((p: any) => p.id) || []);
      setPneuServicosPreview(fatura.items || []);
      setFaturaParcelasPreview(fatura.parcelas || []);
      fetchFaturaLaudos(fatura.id);
      setActiveFaturaModalTab('dados');
    } else {
      setEditingFatura(null);
      setFaturaForm({
        id_contato: null,
        cliente_nome: '',
        id_planopag: null,
        id_vendedor: null,
        id_banco: null,
        id_tipodocto: null,
        obs: '',
        datafat: new Date().toISOString().split('T')[0],
        vrservico: 0,
        vrproduto: 0,
        vrcarcaca: 0,
        vrmontagem: 0,
        vrbonus: 0,
        vrtotal: 0
      });
      setSelectedPneusForFatura([]);
      setOsResults([]); // Limpa a lista de busca
      setSearchParams({ pneu_id: '', numos: '', cliente: '' }); // Limpa os filtros
      setPneuServicosPreview([]);
      setFaturaParcelasPreview([]);
      setFaturaLaudosPreview([]);
      setActiveFaturaModalTab('pneus');
    }
    setIsFaturaModalOpen(true);
  };

  const fetchFaturaLaudos = async (faturaId: number) => {
    try {
      const response = await api.get(`/fatura-laudos/fatura/${faturaId}`);
      setFaturaLaudosPreview(response.data);
    } catch (err) {
      console.error("Erro ao buscar laudos da fatura", err);
    }
  };

  const handleSearchLaudos = async (q: string) => {
    setLaudoSearchQuery(q);
    if (q.length === 0) {
      setLaudoSuggestions([]);
      setShowLaudoSuggestions(false);
      setSelectedLaudoForLinking(null);
      return;
    }
    
    // Check if q is numeric (ID)
    if (!/^\d+$/.test(q)) {
      setLaudoSuggestions([]);
      setShowLaudoSuggestions(false);
      setSelectedLaudoForLinking(null);
      return;
    }

    try {
      // Search ONLY by ID
      const response = await api.get(`/laudos/${q}`);
      if (response.data) {
        setSelectedLaudoForLinking(response.data);
        setLinkingLaudoValue(parseFloat(response.data.vrsaldo || 0));
        setShowLaudoSuggestions(false);
      } else {
        setSelectedLaudoForLinking(null);
      }
    } catch (err) {
      console.error("Erro ao buscar laudo por ID", err);
      setSelectedLaudoForLinking(null);
    }
  };

  const handleConfirmAddLaudo = async () => {
    if (!selectedLaudoForLinking) {
      alert("Selecione um laudo na lista ou digite um ID válido.");
      return;
    }

    const valor = parseFloat(linkingLaudoValue as any);
    if (isNaN(valor) || valor <= 0) {
      alert("Informe um valor válido para o laudo.");
      return;
    }

    if (valor > parseFloat(selectedLaudoForLinking.vrsaldo || 0)) {
      alert("O valor aplicado não pode ser maior que o saldo disponível do laudo.");
      return;
    }

    // Se estiver editando uma fatura existente, salva no banco imediatamente
    if (editingFatura) {
      try {
        setLoading(true);
        const payload = {
          id_fatura: editingFatura.id,
          id_laudo: selectedLaudoForLinking.id,
          valor: valor
        };
        await api.post('/fatura-laudos/', payload);
        await fetchFaturaLaudos(editingFatura.id);
        setIsLaudoModalOpen(false);
        setSelectedLaudoForLinking(null);
        setLaudoSearchQuery('');
        alert("Laudo vinculado com sucesso!");
      } catch (err: any) {
        console.error("Erro ao adicionar laudo", err);
        alert("Erro ao vincular laudo: " + (err.response?.data?.detail || "Erro no servidor"));
      } finally {
        setLoading(false);
      }
    } else {
      // Se for uma fatura nova, adiciona apenas no preview em memória
      const newLaudoPreview = {
        id: Math.random(), // Temp ID
        id_laudo: selectedLaudoForLinking.id,
        numlaudo: selectedLaudoForLinking.numlaudo,
        pneu_id: selectedLaudoForLinking.id_pneu,
        vrcredito: selectedLaudoForLinking.vrcredito,
        vrsaldo: selectedLaudoForLinking.vrsaldo,
        valor: valor
      };
      
      setFaturaLaudosPreview(prev => [...prev, newLaudoPreview]);
      setIsLaudoModalOpen(false);
      setSelectedLaudoForLinking(null);
      setLaudoSearchQuery('');
      alert("Laudo adicionado à fatura (será vinculado ao salvar a fatura).");
    }
  };

  const handleFetchClientLaudos = async () => {
    if (!faturaForm.id_contato) {
      alert("Selecione um cliente primeiro.");
      return;
    }
    try {
      const response = await api.get(`/laudos/cliente/${faturaForm.id_contato}`);
      setClientLaudos(response.data);
      setShowClientLaudosList(true);
    } catch (err) {
      console.error("Erro ao buscar laudos do cliente", err);
    }
  };

  const handleSelectLaudoFromList = (laudo: any) => {
    setLaudoSearchQuery(String(laudo.id));
    setSelectedLaudoForLinking(laudo);
    setLinkingLaudoValue(parseFloat(laudo.vrsaldo || 0));
    setShowClientLaudosList(false);
  };

  const handleDeleteFaturaLaudo = async (id: number) => {
    if (!window.confirm("Deseja desvincular este laudo?")) return;
    try {
      await api.delete(`/fatura-laudos/${id}`);
      if (editingFatura) fetchFaturaLaudos(editingFatura.id);
    } catch (err) {
      console.error("Erro ao deletar vínculo", err);
      alert("Erro ao remover vínculo.");
    }
  };

  const handleInlineUpdateLaudoValue = (id: number, newValue: any) => {
    setFaturaLaudosPreview(prev => prev.map(l => l.id === id ? { ...l, valor: newValue } : l));
  };

  const handleSaveLaudoValue = async (id: number, value: number) => {
    try {
      await api.put(`/fatura-laudos/${id}`, { valor: value });
    } catch (err) {
      console.error("Erro ao salvar valor do laudo", err);
      alert("Erro ao salvar valor do laudo no banco.");
    }
  };

  const fetchPendingPneus = async (clientId: number) => {
    try {
      setLoading(true);
      // Busca pneus que estão prontos para faturamento (statusfat = false e qservico > 0)
      const response = await api.get(`/ordens-servico/pneus-pendentes?id_contato=${clientId}`);
      setOsResults(response.data);
    } catch (err) {
      console.error("Erro ao buscar pneus pendentes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePneuSelection = (pneuId: number) => {
    setSelectedPneusForFatura(prev => {
      const isSelected = prev.includes(pneuId);
      if (isSelected) {
        return prev.filter(id => id !== pneuId);
      } else {
        return [...prev, pneuId];
      }
    });
  };

  const handleSelectAllPneus = () => {
    if (osResults.length === 0) return;
    
    const allIds = osResults.map(p => p.pneu_id);
    const allSelected = allIds.every(id => selectedPneusForFatura.includes(id));
    
    if (allSelected) {
      // Remove all visible ones from selection
      setSelectedPneusForFatura(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      // Add all visible ones (avoid duplicates)
      setSelectedPneusForFatura(prev => {
        const newSelection = [...prev];
        allIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  // Logic to proceed to fatura details from pneu selection
  const handleProceedToFaturaDetails = async () => {
    if (selectedPneusForFatura.length === 0) {
      setError("Selecione ao menos um pneu para faturar.");
      return;
    }

    setLoading(true);
    try {
      const allServices: any[] = [];
      let totalServicos = 0;

      // Varre a lista de pneus marcados
      for (const pid of selectedPneusForFatura) {
        // lê os serviços informados na tabela pneu_servico
        const res = await api.get(`/pneu-servicos/pneu/${pid}`);
        const services = res.data;
        allServices.push(...services);
        totalServicos += services.reduce((acc: number, s: any) => acc + parseFloat(s.vrtotal || 0), 0);
      }

      // Popula os registros de preview (que serão salvos em fatura_servico)
      setPneuServicosPreview(allServices);

      // Busca dados do cliente a partir dos pneus selecionados
      const selectedData = osResults.filter(p => selectedPneusForFatura.includes(p.pneu_id));
      let newContactId = faturaForm.id_contato;
      let newContactNome = faturaForm.cliente_nome;
      let newVendedorId = faturaForm.id_vendedor;

      if (selectedData.length > 0 && !editingFatura) {
        newContactId = selectedData[0].id_contato || selectedData[0].contato_id;
        newContactNome = selectedData[0].contato_nome;
        newVendedorId = (selectedData[0].id_vendedor !== undefined && selectedData[0].id_vendedor !== null) 
          ? selectedData[0].id_vendedor 
          : null;
      }

      // Atualiza o formulário com o total de serviços e cliente
      setFaturaForm(prev => ({
        ...prev,
        vrservico: totalServicos,
        id_contato: newContactId,
        cliente_nome: newContactNome,
        id_vendedor: newVendedorId
      }));

      // Foca na aba dados da fatura
      setActiveFaturaModalTab('dados');
    } catch (err) {
      console.error("Erro ao varrer serviços dos pneus", err);
      setError("Erro ao carregar detalhes dos serviços. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Calcular parcelas para preview
  useEffect(() => {
    const calculateParcelas = () => {
      if (isFaturaModalOpen && faturaForm.id_planopag && !editingFatura) {
        const plano = allPlanosPag.find(p => p.id === faturaForm.id_planopag);
        if (plano && plano.numparc) {
          const totalLaudos = faturaLaudosPreview.reduce((acc, curr) => acc + parseFloat(curr.valor || 0), 0);
          const total = faturaForm.vrservico + faturaForm.vrproduto + faturaForm.vrcarcaca + faturaForm.vrmontagem - faturaForm.vrbonus - totalLaudos;
          const valorParcela = total / plano.numparc;
          const parcelas = [];
          const dataBase = new Date(faturaForm.datafat);

          for (let i = 1; i <= plano.numparc; i++) {
            const venc = new Date(dataBase);
            venc.setDate(venc.getDate() + (30 * i));
            parcelas.push({
              num_parcela: i,
              vencto: venc.toISOString(),
              valor: valorParcela,
              id_tipodocto: faturaForm.id_tipodocto
            });
          }
          setFaturaParcelasPreview(parcelas);
        }
      }
    };
    calculateParcelas();
  }, [faturaForm.id_planopag, faturaForm.id_tipodocto, faturaForm.vrservico, faturaForm.vrproduto, faturaForm.vrcarcaca, faturaForm.vrmontagem, faturaForm.vrbonus, faturaForm.datafat, allPlanosPag, isFaturaModalOpen, editingFatura, faturaLaudosPreview]);


  const handleSaveFatura = async () => {
    if (!faturaForm.id_contato || selectedPneusForFatura.length === 0) {
      alert("Selecione um cliente e ao menos um pneu.");
      return;
    }

    try {
      const payload = {
        ...faturaForm,
        pneu_ids: selectedPneusForFatura,
        parcelas: faturaParcelasPreview,
        vrtotal: (faturaForm.vrservico + faturaForm.vrproduto + faturaForm.vrcarcaca + faturaForm.vrmontagem - faturaForm.vrbonus - faturaLaudosPreview.reduce((acc, curr) => acc + parseFloat(curr.valor || 0), 0))
      };

      if (editingFatura) {
        await api.put(`/faturas/${editingFatura.id}`, payload);
        alert("Fatura atualizada com sucesso!");
      } else {
        const response = await api.post('/faturas/', payload);
        const newFaturaId = response.data.id;
        
        // Se houver laudos em memória (fatura nova), vincula agora
        if (faturaLaudosPreview.length > 0) {
          for (const l of faturaLaudosPreview) {
            if (!l.id_fatura) { // Somente os que ainda não foram salvos
              await api.post('/fatura-laudos/', {
                id_fatura: newFaturaId,
                id_laudo: l.id_laudo,
                valor: l.valor
              });
            }
          }
        }
        
        alert("Fatura gerada com sucesso!");
      }

      setIsFaturaModalOpen(false);
      fetchFaturas();
    } catch (err: any) {
      console.error("Erro completo ao salvar fatura:", err);
      const data = err.response?.data;
      const detail = data?.detail;
      
      let errorMessage = "Erro de conexão ou validação no servidor.";
      
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((d: any) => d.msg || d.message).join(', ');
      } else if (data?.message) {
        errorMessage = data.message;
      }
      
      alert(`⚠️ Erro ao salvar fatura:\n${errorMessage}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'informe' && pneuResults.length > 0) {
      fetchPneuServicos(pneuResults[0].pneu_id);
    }
  }, [pneuResults, activeTab]);

  const fetchPneuServicos = async (pneuId: number) => {
    try {
      const response = await api.get(`/pneu-servicos/pneu/${pneuId}`);
      setPneuServicos(response.data);
    } catch (err) {
      console.error("Erro ao buscar serviços adicionais", err);
    }
  };

  const handleEditParcela = (index: number) => {
    const p = faturaParcelasPreview[index];
    setEditingParcelaIndex(index);
    setEditingParcelaData({
      num_parcela: p.num_parcela,
      vencto: p.vencto ? p.vencto.split('T')[0] : '',
      valor: p.valor,
      id_tipodocto: p.id_tipodocto || null
    });
    setIsEditParcelaModalOpen(true);
  };

  const handleSaveEditedParcela = () => {
    if (editingParcelaIndex === null) return;
    const newParcelas = [...faturaParcelasPreview];
    newParcelas[editingParcelaIndex] = {
      ...newParcelas[editingParcelaIndex],
      vencto: new Date(editingParcelaData.vencto).toISOString(),
      valor: editingParcelaData.valor,
      id_tipodocto: editingParcelaData.id_tipodocto
    };
    setFaturaParcelasPreview(newParcelas);
    setIsEditParcelaModalOpen(false);
  };

  const handleDeleteParcela = (index: number) => {
    if (window.confirm("Deseja realmente excluir esta parcela?")) {
      const newParcelas = [...faturaParcelasPreview];
      newParcelas.splice(index, 1);
      setFaturaParcelasPreview(newParcelas);
    }
  };

  const fetchMasterServicos = async () => {
    try {
      const response = await api.get('/servicos/');
      setAllServicos(response.data);
    } catch (err) {
      console.error("Erro ao buscar mestre de serviços", err);
    }
  };

  const handleOpenAddServicoModal = () => {
    setEditingServico(null);
    if (pneuResults.length === 0) return;
    
    const pneu = pneuResults[0];
    const mainServiceId = pneu.id_servico_base;

    const alreadyAdded = pneuServicos.some(s => Number(s.id_servico) == Number(mainServiceId));
    
    if (!alreadyAdded && mainServiceId) {
      const master = allServicos.find(s => Number(s.id) == Number(mainServiceId));
      setNewServico({ 
        id_servico: mainServiceId, 
        quant: 1, 
        valor: typeof pneu.valor_pneu === 'string' ? parseFloat(pneu.valor_pneu) : pneu.valor_pneu 
      });
      setServicoSearchQuery(master?.descricao || '');
    } else {
      setNewServico({ id_servico: 0, quant: 1, valor: 0 });
      setServicoSearchQuery('');
    }
    
    setShowServicoSuggestions(false);
    setIsServicoModalOpen(true);
  };

  const handleOpenEditServicoModal = (ps: any) => {
    setEditingServico(ps);
    setNewServico({
      id_servico: ps.id_servico,
      quant: ps.quant,
      valor: parseFloat(ps.valor)
    });
    setServicoSearchQuery(ps.servico_descricao || '');
    setShowServicoSuggestions(false);
    setIsServicoModalOpen(true);
  };

  const handleSelectServicoSuggestion = (s: any) => {
    setNewServico({ ...newServico, id_servico: s.id, valor: Number(s.valor) });
    setServicoSearchQuery(s.descricao);
    setShowServicoSuggestions(false);
  };

  const filteredServicos = allServicos.filter(s => 
    s.descricao.toLowerCase().includes(servicoSearchQuery.toLowerCase())
  ).slice(0, 10);

  const handleAddServico = async () => {
    if (!newServico.id_servico || newServico.id_servico === 0) return;
    if (pneuResults.length === 0) return;

    try {
      const pneu = pneuResults[0];
      const selectedMaster = allServicos.find(s => s.id === parseInt(newServico.id_servico.toString()));
      const valorUsar = newServico.valor > 0 ? newServico.valor : (selectedMaster?.valor || 0);

      const payload = {
        id_pneu: pneu.pneu_id,
        id_servico: parseInt(newServico.id_servico.toString()),
        id_ordem: pneu.os_id,
        quant: newServico.quant,
        valor: valorUsar,
        vrtotal: valorUsar * newServico.quant,
        vrtabela: selectedMaster?.valor || 0
      };

      if (editingServico) {
        await api.put(`/pneu-servicos/${editingServico.id}`, payload);
      } else {
        await api.post('/pneu-servicos/', payload);
      }
      
      await fetchPneuServicos(pneu.pneu_id);
      // Também atualiza o painel do pneu para ver o novo VrServico
      const pSearch = await api.get(`/ordens-servico/pneu-search/?q=${encodeURIComponent(pneuSearchQuery)}`);
      setPneuResults(pSearch.data);

      setIsServicoModalOpen(false);
      setNewServico({ id_servico: 0, quant: 1, valor: 0 });
      setEditingServico(null);
    } catch (err) {
      setError("Erro ao salvar serviço.");
    }
  };

  const handleDeleteServico = async (id: number) => {
    if (!window.confirm("Deseja remover este serviço?")) return;
    try {
      await api.delete(`/pneu-servicos/${id}`);
      if (pneuResults.length > 0) {
        await fetchPneuServicos(pneuResults[0].pneu_id);
      }
    } catch (err) {
      setError("Erro ao excluir serviço.");
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes/');
      setClientes(response.data);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    }
  };

  // Logic for Pneu Search (Tab 1)
  const handlePneuSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pneuSearchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/ordens-servico/pneu-search/?q=${encodeURIComponent(pneuSearchQuery)}`);
      setPneuResults(response.data);
      if (response.data.length === 0) {
        setError('Nenhum pneu encontrado com este número de série ou fogo.');
      }
    } catch (err: any) {
      setError('Erro ao buscar pneu. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Logic for OS Search (Tab 2 - Mirrored from Producao)
  const handleOSSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOsResults([]);

    try {
      let url = '/ordens-servico/pneus-pendentes/';
      const params = new URLSearchParams();
      if (searchParams.id) params.append('os_id', searchParams.id);
      if (searchParams.id_pneu) params.append('pneu_id', searchParams.id_pneu);
      if (searchParams.numos) params.append('numos', searchParams.numos);
      if (searchParams.cliente) params.append('cliente', searchParams.cliente);

      const queryString = params.toString();
      const finalUrl = queryString ? `${url}?${queryString}` : url;
      const response = await api.get(finalUrl);
      setOsResults(response.data); // Usando osResults para guardar a lista de pneus pendentes
      if (response.data.length === 0) {
        setError('Nenhum pneu pendente de faturamento encontrado.');
      }
    } catch (err: any) {
      setError('Erro ao buscar dados para faturamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaturarFromPneu = async (osId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/ordens-servico/${osId}`);
      openBillingModal(response.data);
    } catch (err) {
      console.error("Erro ao buscar dados da OS", err);
      alert("Erro ao carregar dados da OS.");
    } finally {
      setLoading(false);
    }
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchParams({ ...searchParams, cliente: value });
    
    if (value.length >= 2) {
      if (clientes.length === 0) {
        fetchClientes(); // Tenta carregar se estiver vazio
      }
      
      const searchTerm = value.toLowerCase().trim();
      const filtered = clientes.filter(c => {
        if (!c || !c.nome) return false;
        return c.nome.toLowerCase().includes(searchTerm);
      }).slice(0, 10);
      
      setFilteredClientes(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCliente = (clienteNome: string) => {
    setSearchParams({ ...searchParams, cliente: clienteNome });
    setShowSuggestions(false);
    setTimeout(() => {
      document.getElementById('os-search-form')?.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }, 50);
  };

  return (
    <div className="faturamento-container">
      <div className="page-header">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <CreditCard size={32} color="var(--primary-color)" />
          Faturamento de Pneus
        </h1>
        <div className="header-actions">
           <button className="btn-primary" onClick={() => navigate('/rel-vendas-servico')}>
            <Printer size={20} />
            Relatórios de Vendas
          </button>
        </div>
      </div>

      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === 'informe' ? 'active' : ''}`}
          onClick={() => setActiveTab('informe')}
        >
          <FileText size={18} />
          Informe de Serviços
        </button>
        <button 
          className={`tab-btn ${activeTab === 'faturas' ? 'active' : ''}`}
          onClick={() => setActiveTab('faturas')}
        >
          <CreditCard size={18} />
          Gerenciar Faturas
        </button>
      </div>

      {error && (
        <div className="error-banner animate-fade-in" style={{ marginBottom: '1.5rem', background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <TrendingUp size={20} style={{ transform: 'rotate(90deg)' }} />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'informe' && (
        <div className="tab-content animate-fade-in">
          {/* Busca por Pneu */}
          <div className="search-section glass-panel" style={{ marginBottom: '2rem' }}>
            <form onSubmit={handlePneuSearch} className="search-form-producao">
              <div className="search-grid" style={{ gridTemplateColumns: '1fr auto' }}>
                <div className="form-group">
                  <label><Hash size={14} /> ID do Pneu ou Cód. Barras</label>
                  <div className="input-with-button">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Escaneie o código de barras ou digite o ID do pneu..." 
                      value={pneuSearchQuery}
                      onChange={(e) => setPneuSearchQuery(e.target.value)}
                      style={{ fontSize: '1.2rem', padding: '0.8rem 1.2rem', fontWeight: 'bold' }}
                      autoFocus
                    />
                    <button type="submit" className="btn-search-producao" disabled={loading} style={{ height: '52px' }}>
                      {loading ? 'Identificando...' : <><Search size={22} /> Identificar Pneu</>}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Resultado Único da Busca por Pneu - Apenas Campos */}
          {pneuResults.length > 0 && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', paddingLeft: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}></div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pneu Identificado com Sucesso
                </h3>
              </div>
              {pneuResults.map(p => (
                <div key={p.pneu_id} className="glass-panel" style={{ padding: '2rem' }}>
                  <div className="search-grid" style={{ marginBottom: '2rem' }}>
                    
                    <div className="form-group">
                      <label><Hash size={14} /> ID Interno (Pneu)</label>
                      <input type="text" className="form-input" value={p.pneu_id} readOnly style={{ fontWeight: '800', background: 'rgba(37, 99, 235, 0.05)', color: '#1d4ed8' }} />
                    </div>

                    <div className="form-group span-3">
                      <label><User size={14} /> Nome do Cliente</label>
                      <input type="text" className="form-input" value={p.contato_nome} readOnly style={{ fontWeight: '600' }} />
                    </div>

                    <div className="form-group">
                      <label><FileText size={14} /> Nº Ordem de Serviço</label>
                      <input type="text" className="form-input" value={p.numos > 0 ? p.numos : 'NÃO VINCULADA'} readOnly style={{ fontWeight: 'bold', color: p.numos > 0 ? 'var(--primary-color)' : '#94a3b8' }} />
                    </div>

                    <div className="form-group">
                      <label><Package size={14} /> Medida</label>
                      <input type="text" className="form-input" value={p.medida_nome} readOnly />
                    </div>

                    <div className="form-group">
                      <label><TrendingUp size={14} /> Marca / Produto</label>
                      <input type="text" className="form-input" value={p.produto_nome} readOnly />
                    </div>

                    <div className="form-group">
                      <label><CheckCircle size={14} /> Desenho</label>
                      <input type="text" className="form-input" value={p.desenho_nome} readOnly />
                    </div>

                    <div className="form-group">
                      <label><Settings size={14} /> Tipo Recapagem</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={p.tiporecap_nome} 
                        readOnly 
                        style={{ color: '#059669', fontWeight: '600' }} 
                      />
                    </div>

                    <div className="form-group">
                      <label><Clock size={14} /> DOT</label>
                      <input type="text" className="form-input" value={p.dot || '---'} readOnly />
                    </div>

                    <div className="form-group">
                      <label><Hash size={14} /> Num. Série</label>
                      <input type="text" className="form-input" value={p.numserie || '---'} readOnly />
                    </div>

                    <div className="form-group">
                      <label><Hash size={14} /> Num. Fogo</label>
                      <input type="text" className="form-input" value={p.numfogo || '---'} readOnly />
                    </div>

                    <div className="form-group">
                      <label><Activity size={14} /> Qte. Serviço</label>
                      <input type="text" className="form-input" value={p.qservico || 0} readOnly style={{ color: '#6366f1', fontWeight: '600' }} />
                    </div>

                    <div className="form-group">
                      <label><DollarSign size={14} /> Vr. Serviço</label>
                      <input type="text" className="form-input" value={`R$ ${parseFloat(p.vrservico as any || 0).toFixed(2)}`} readOnly style={{ color: '#10b981', fontWeight: '600' }} />
                    </div>

                    <div className="form-group">
                      <label><TrendingUp size={14} /> Status Produção</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={p.statuspro ? 'Sim' : 'Não'} 
                        readOnly 
                        style={{ background: p.statuspro ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: p.statuspro ? '#059669' : '#b91c1c', fontWeight: '700' }} 
                      />
                    </div>

                    <div className="form-group">
                      <label><CreditCard size={14} /> Status Faturamento</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={p.statusfat ? 'Sim' : 'Não'} 
                        readOnly 
                        style={{ background: p.statusfat ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: p.statusfat ? '#1d4ed8' : '#b91c1c', fontWeight: '700' }} 
                      />
                    </div>

                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                     <button className="btn-secondary" onClick={() => { setPneuResults([]); setPneuSearchQuery(''); setPneuServicos([]); }}>Nova Pesquisa</button>
                  </div>
                </div>
              ))}

              {/* Seção de Serviços Adicionais */}
              <div className="glass-panel animate-fade-in" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1e293b' }}>
                    <Settings size={20} color="var(--primary-color)" />
                    Serviços Adicionais do Pneu
                  </h3>
                  <button className="btn-primary" onClick={handleOpenAddServicoModal} style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
                    <Plus size={16} /> Adicionar Serviço
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th>Descrição do Serviço</th>
                        <th>Quant.</th>
                        <th>Valor Unit.</th>
                        <th>Valor Total</th>
                        <th style={{ width: '80px' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pneuServicos.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Nenhum serviço adicional lançado para este pneu.
                          </td>
                        </tr>
                      ) : (
                        pneuServicos.map(ps => (
                          <tr key={ps.id}>
                            <td style={{ fontWeight: '600', color: '#1e293b' }}>{ps.servico_descricao}</td>
                            <td>{ps.quant}</td>
                            <td>R$ {parseFloat(ps.valor).toFixed(2)}</td>
                            <td style={{ fontWeight: '700', color: '#2563eb' }}>R$ {parseFloat(ps.vrtotal).toFixed(2)}</td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="icon-btn edit" onClick={() => handleOpenEditServicoModal(ps)} title="Editar" style={{ color: '#2563eb' }}>
                                <Settings size={16} />
                              </button>
                              <button className="icon-btn delete" onClick={() => handleDeleteServico(ps.id)} title="Excluir">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para Adicionar Serviço */}
      {isServicoModalOpen && (
        <div className="os-modal-overlay" onClick={() => setIsServicoModalOpen(false)}>
          <div className="premium-modal-content medium" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="premium-modal-header">
              <h2>{editingServico ? 'Alterar Serviço' : 'Lançar Novo Serviço'}</h2>
              <button className="close-btn" onClick={() => setIsServicoModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body" style={{ padding: '2rem', background: '#f8fafc' }}>
              <div className="premium-master-panel" style={{ padding: '1.5rem', marginBottom: 0 }}>
              <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label>Descrição do Serviço</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Comece a digitar para buscar..." 
                    value={servicoSearchQuery}
                    onChange={(e) => {
                      setServicoSearchQuery(e.target.value);
                      setShowServicoSuggestions(true);
                      if (newServico.id_servico !== 0) {
                        setNewServico({ ...newServico, id_servico: 0 });
                      }
                    }}
                    onFocus={() => setShowServicoSuggestions(true)}
                  />
                  {showServicoSuggestions && servicoSearchQuery.length > 0 && (
                    <div className="autocomplete-dropdown glass-panel">
                      {filteredServicos.length === 0 ? (
                        <div className="autocomplete-item empty">Nenhum serviço encontrado</div>
                      ) : (
                        filteredServicos.map(s => (
                          <div 
                            key={s.id} 
                            className="autocomplete-item"
                            onClick={() => handleSelectServicoSuggestion(s)}
                            style={{ cursor: 'pointer', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}
                          >
                            <span style={{ fontWeight: '500', color: '#1e293b' }}>{s.descricao}</span>
                            <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: '600' }}>R$ {parseFloat(s.valor).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Quantidade</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newServico.quant} 
                    onChange={(e) => setNewServico({ ...newServico, quant: parseInt(e.target.value) || 1 })} 
                  />
                </div>
                <div className="form-group">
                  <label>Valor Unitário (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    value={newServico.valor} 
                    onChange={(e) => setNewServico({ ...newServico, valor: parseFloat(e.target.value) || 0 })} 
                  />
                </div>
              </div>
            </div>
            </div>
            <div className="premium-modal-footer">
              <button className="btn-secondary" onClick={() => setIsServicoModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddServico} disabled={!newServico.id_servico}>Gravar Serviço</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'faturas' && (
        <div className="tab-content animate-fade-in">
           {/* Master View: List of Faturas */}
            <div className="search-section glass-panel" style={{ marginBottom: '2rem' }}>
              <div className="search-grid" style={{ gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'flex-end' }}>
                <div className="form-group">
                  <label><Search size={14} /> Buscar Fatura (Número ou Cliente)</label>
                  <div className="input-with-button">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Digite o número da fatura ou nome do cliente..." 
                      value={faturaSearchQuery}
                      onChange={(e) => setFaturaSearchQuery(e.target.value)}
                      style={{ height: '52px', fontSize: '1.05rem' }}
                    />
                    <button 
                      className="btn-search-producao" 
                      onClick={fetchFaturas}
                      style={{ height: '52px', padding: '0 2rem' }}
                    >
                      {faturaLoading ? '...' : <><Search size={22} /> Buscar</>}
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.8rem' }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      if (selectedFaturaIds.length === 0) return alert("Selecione ao menos uma fatura para gerar NF.");
                      alert(`Gerando NF para as faturas: ${selectedFaturaIds.join(', ')}`);
                    }} 
                    style={{ height: '52px', padding: '0 1.5rem', background: '#10b981', whiteSpace: 'nowrap' }}
                  >
                    <FileText size={20} /> Gerar NF
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={handlePrintList} 
                    style={{ height: '52px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
                  >
                    <Printer size={20} /> Imprimir Lista
                  </button>
                  <button className="btn-primary" onClick={() => handleOpenFaturaModal()} style={{ height: '52px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}>
                    <Plus size={20} /> Nova Fatura
                  </button>
                </div>
              </div>
           </div>

           <div className="faturas-master-detail-grid" style={{ display: 'grid', gridTemplateColumns: selectedFatura ? '1fr 400px' : '1fr', gap: '2rem', transition: 'all 0.3s ease' }}>
              <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                 <div className="table-responsive">
                    <table className="data-table">
                       <thead>
                          <tr>
                             <th style={{ width: '40px' }}>
                               <input 
                                 type="checkbox" 
                                 checked={faturas.length > 0 && selectedFaturaIds.length === faturas.length}
                                 onChange={handleSelectAllFaturas}
                                 onClick={e => e.stopPropagation()}
                               />
                             </th>
                             <th style={{ width: '80px' }}>ID</th>
                             <th style={{ width: '100px' }}>Data Fat</th>
                             <th>Vendedor</th>
                             <th>Cliente</th>
                             <th>Valor Total</th>
                             <th style={{ width: '120px' }}>Ações</th>
                          </tr>
                       </thead>
                       <tbody>
                          {faturas.length === 0 && !faturaLoading ? (
                             <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhuma fatura encontrada.</td>
                             </tr>
                          ) : (
                             faturas.map(f => (
                                <tr 
                                  key={f.id} 
                                  onClick={() => setSelectedFatura(f)}
                                  className={selectedFatura?.id === f.id ? 'selected-row' : ''}
                                  style={{ 
                                    cursor: 'pointer', 
                                    background: selectedFaturaIds.includes(f.id) 
                                      ? 'rgba(37, 99, 235, 0.08)' 
                                      : (selectedFatura?.id === f.id ? 'rgba(37, 99, 235, 0.05)' : 'transparent') 
                                  }}
                                >
                                   <td>
                                     <input 
                                       type="checkbox" 
                                       checked={selectedFaturaIds.includes(f.id)}
                                       onChange={() => handleToggleFaturaSelection(f.id)}
                                       onClick={e => e.stopPropagation()}
                                     />
                                   </td>
                                   <td><span className="os-number">#{f.id}</span></td>
                                   <td>{new Date(f.datafat).toLocaleDateString()}</td>
                                   <td style={{ fontWeight: '500' }}>{f.vendedor_nome || '---'}</td>
                                   <td style={{ fontWeight: '600' }}>{f.contato_nome}</td>
                                   <td style={{ fontWeight: '700', color: '#10b981' }}>R$ {parseFloat(f.vrtotal || 0).toFixed(2)}</td>
                                   <td>
                                      <div className="action-buttons" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                         <button 
                                           className="btn-icon-premium success" 
                                           title="Visualizar Detalhes" 
                                           onClick={() => handleOpenFaturaModal(f, 'view')} 
                                           style={{ background: '#10b981', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                         >
                                           <Eye size={18} />
                                         </button>
                                         <button 
                                           className="btn-icon-premium edit" 
                                           title="Editar Fatura" 
                                           onClick={() => handleOpenFaturaModal(f, 'edit')}
                                           style={{ background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                         >
                                           <Edit size={18} />
                                         </button>
                                         <button 
                                           className="btn-icon-premium delete" 
                                           title="Excluir Fatura" 
                                           onClick={() => handleDeleteFatura(f.id)}
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
                 </div>
              </div>

              {/* Detail View: Selected Fatura Items */}
              {selectedFatura && (
                 <div className="glass-panel animate-slide-in-right" style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', position: 'sticky', top: '20px', height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                       <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FileText size={18} color="var(--primary-color)" />
                          Detalhes da Fatura #{selectedFatura.id}
                       </h3>
                       <button className="close-btn" onClick={() => setSelectedFatura(null)} style={{ padding: '4px' }}><X size={20} /></button>
                    </div>

                    <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', marginBottom: '1rem' }}>
                          <span style={{ color: '#64748b' }}>Cliente:</span>
                          <span style={{ fontWeight: '600' }}>{selectedFatura.contato_nome}</span>
                          <span style={{ color: '#64748b' }}>Vendedor:</span>
                           <span style={{ fontWeight: '500' }}>{selectedFatura.vendedor_nome || '---'}</span>
                           <span style={{ color: '#64748b' }}>Data Emissão:</span>
                          <span>{new Date(selectedFatura.datafat).toLocaleString()}</span>
                       </div>
                       
                       <div style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                             <span style={{ opacity: 0.7 }}>Serviços:</span>
                             <span style={{ fontWeight: '600' }}>R$ {parseFloat(selectedFatura.vrservico).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                             <span style={{ opacity: 0.7 }}>Produtos:</span>
                             <span>R$ {parseFloat(selectedFatura.vrproduto).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                             <span style={{ opacity: 0.7 }}>Outros:</span>
                             <span>R$ {(parseFloat(selectedFatura.vrcarcaca) + parseFloat(selectedFatura.vrmontagem)).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#dc2626' }}>
                             <span style={{ opacity: 0.7 }}>Descontos:</span>
                             <span>- R$ {parseFloat(selectedFatura.vrbonus).toFixed(2)}</span>
                          </div>
                          <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: '0.8rem', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem', color: '#1e293b' }}>
                             <span>TOTAL:</span>
                             <span style={{ color: '#10b981' }}>R$ {parseFloat(selectedFatura.vrtotal).toFixed(2)}</span>
                          </div>
                       </div>
                    </div>

                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '1rem' }}>Pneus Vinculados</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                       {selectedFatura.pneus?.map((p: any) => (
                          <div key={p.id} style={{ background: 'white', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                             <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={20} color="#64748b" />
                             </div>
                             <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>ID #{p.id}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.servico_nome}</div>
                             </div>
                             <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#2563eb' }}>R$ {parseFloat(p.valor).toFixed(2)}</div>
                          </div>
                       ))}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                       <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.print()}>
                          <Printer size={18} /> Imprimir Fatura
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Modal para Cálculo de Fatura */}
      {isBillingModalOpen && selectedOSForBilling && (
        <div className="os-modal-overlay" onClick={() => setIsBillingModalOpen(false)}>
          <div className="premium-modal-content medium" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="premium-modal-header">
              <h2>Cálculo de Fatura - OS #{selectedOSForBilling.numos}</h2>
              <button className="close-btn" onClick={() => setIsBillingModalOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="modal-body scrollable" style={{ padding: '1.5rem', background: '#E5E5E5' }}>
              <div className="premium-master-panel" style={{ marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '1.1rem' }}>
                  <User size={18} style={{ marginRight: '0.5rem' }} />
                  Cliente: {selectedOSForBilling.contato_nome}
                </p>
              </div>

              <div className="premium-master-panel">
                <div className="premium-section-title"><DollarSign size={18} /> Composição de Valores</div>
                <div className="form-group">
                  <label><Settings size={14} /> Total de Serviços (R$)</label>
                  <input type="number" className="form-input" value={billingFinancials.vrservico} readOnly style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group">
                  <label><Package size={14} /> Adicional de Produtos (R$)</label>
                  <input type="number" step="0.01" className="form-input" value={billingFinancials.vrproduto} onChange={(e) => setBillingFinancials({...billingFinancials, vrproduto: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label><TrendingUp size={14} /> Valor Carcaça (R$)</label>
                  <input type="number" step="0.01" className="form-input" value={billingFinancials.vrcarcaca} onChange={(e) => setBillingFinancials({...billingFinancials, vrcarcaca: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label><TrendingUp size={14} /> Montagem (R$)</label>
                  <input type="number" step="0.01" className="form-input" value={billingFinancials.vrmontagem} onChange={(e) => setBillingFinancials({...billingFinancials, vrmontagem: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ color: '#dc2626' }}><DollarSign size={14} /> Descontos / Bonus (R$)</label>
                  <input type="number" step="0.01" className="form-input highlight-field" value={billingFinancials.vrbonus} onChange={(e) => setBillingFinancials({...billingFinancials, vrbonus: parseFloat(e.target.value) || 0})} style={{ border: '1px solid #fecaca' }} />
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Plano de Pagamento</label>
                  <select 
                    className="form-input" 
                    value={billingFinancials.id_planopag} 
                    onChange={(e) => setBillingFinancials({...billingFinancials, id_planopag: parseInt(e.target.value)})}
                  >
                    <option value="0">Selecione o plano...</option>
                    {allPlanosPag.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.formapag} ({plan.numparc}x)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#1e293b', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '1.1rem', opacity: 0.9 }}>Valor Total da Fatura:</span>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981' }}>R$ {calculateBillingTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="premium-modal-footer">
              <button className="btn-secondary" onClick={() => setIsBillingModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleFinalizeBilling}>
                <CheckCircle size={20} /> Finalizar Faturamento
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Edição/Criação de Fatura (CRUD Completo) */}
      {isFaturaModalOpen && (
        <div className="os-modal-overlay" onClick={() => setIsFaturaModalOpen(false)}>
          <div className="premium-modal-content full-screen" onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{faturaModalMode === 'view' ? `Visualizando Fatura #${editingFatura?.numfatura || editingFatura?.id}` : editingFatura ? `Editar Fatura #${editingFatura.numfatura || editingFatura.id}` : 'Nova Fatura Manual'}</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {(faturaModalMode === 'edit' || faturaModalMode === 'view') && (
                  <button className="btn-primary" onClick={() => handlePrintSingleFatura(editingFatura)} style={{ background: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <Printer size={18} /> Imprime Fatura
                  </button>
                )}
                <button className="close-btn" onClick={() => setIsFaturaModalOpen(false)}><X size={24} /></button>
              </div>
            </div>

            {/* Sub-tabs da Modal */}
            <div className="modal-tabs" style={{ display: 'flex', background: '#f8fafc', padding: '0 1rem', borderBottom: '1px solid #e2e8f0' }}>
              <button 
                className={`modal-tab-btn ${activeFaturaModalTab === 'pneus' ? 'active' : ''}`}
                onClick={() => setActiveFaturaModalTab('pneus')}
                style={{ padding: '1rem 2rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700', color: activeFaturaModalTab === 'pneus' ? 'var(--primary-color)' : '#64748b', borderBottom: activeFaturaModalTab === 'pneus' ? '3px solid var(--primary-color)' : 'none' }}
              >
                1. Seleção de Pneus
              </button>
              <button 
                className={`modal-tab-btn ${activeFaturaModalTab === 'dados' ? 'active' : ''}`}
                onClick={() => setActiveFaturaModalTab('dados')}
                style={{ padding: '1rem 2rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700', color: activeFaturaModalTab === 'dados' ? 'var(--primary-color)' : '#64748b', borderBottom: activeFaturaModalTab === 'dados' ? '3px solid var(--primary-color)' : 'none' }}
              >
                2. Dados da Fatura
              </button>
            </div>

            <div className="modal-body scrollable" style={{ background: '#E5E5E5', padding: '1.5rem' }}>
              {activeFaturaModalTab === 'pneus' && (
                <div className="animate-fade-in">
                  <div className="premium-master-panel" style={{ marginBottom: '1.5rem' }}>
                    <div className="premium-section-title"><Search size={18} /> Filtros de Busca</div>
                    <form onSubmit={handleOSSearch} className="search-form-producao">
                      <div className="search-grid" style={{ gridTemplateColumns: '120px 140px 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className="form-group">
                          <label><Hash size={12} /> ID OS</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="ID"
                            value={searchParams.id}
                            onChange={(e) => setSearchParams({...searchParams, id: e.target.value})}
                            disabled={faturaModalMode === 'view'}
                          />
                        </div>
                        <div className="form-group">
                          <label><FileText size={12} /> Nº OS</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Nº"
                            value={searchParams.numos}
                            onChange={(e) => setSearchParams({...searchParams, numos: e.target.value})}
                            disabled={faturaModalMode === 'view'}
                          />
                        </div>
                        <div className="form-group" style={{ position: 'relative', overflow: 'visible' }}>
                          <label><User size={12} /> Nome do Cliente</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Digite o nome do cliente para filtrar..." 
                            value={searchParams.cliente}
                            onChange={handleClienteChange}
                            onFocus={() => faturaModalMode !== 'view' && searchParams.cliente.length >= 2 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            disabled={faturaModalMode === 'view'}
                            list="clientes-list"
                          />
                          <datalist id="clientes-list">
                            {clientes.map(c => <option key={c.id} value={c.nome} />)}
                          </datalist>
                          <style>{`
                            .suggestions-dropdown {
                              position: absolute;
                              left: 0;
                              right: 0;
                              background: white;
                              border: 1px solid #e2e8f0;
                              border-radius: 8px;
                              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
                              z-index: 9999 !important;
                              max-height: 200px;
                              overflow-y: auto;
                              margin-top: 4px;
                            }
                            .suggestion-item {
                              padding: 0.8rem 1rem;
                              display: flex;
                              align-items: center;
                              gap: 0.5rem;
                              cursor: pointer;
                              transition: background 0.2s;
                              color: #1e293b;
                              border-bottom: 1px solid #f1f5f9;
                            }
                            .suggestion-item:hover {
                              background: #f1f5f9;
                              color: var(--primary-color);
                            }
                          `}</style>
                          {showSuggestions && filteredClientes.length > 0 && (
                            <div className="suggestions-dropdown">
                              {filteredClientes.map(c => (
                                <div key={c.id} className="suggestion-item" onClick={() => selectCliente(c.nome)}>
                                  <User size={14} />
                                  <span>{c.nome}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label style={{ visibility: 'hidden' }}><Search size={12} /> Pesquisar</label>
                          <button type="submit" className="btn-search-producao" disabled={loading || faturaModalMode === 'view'} style={{ height: '42px', padding: '0 1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', width: '100%' }}>
                            {loading ? '...' : <><Search size={20} /> Pesquisar Pneus</>}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="premium-master-panel">
                    <div className="premium-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={18} /> Pneus Prontos para Faturamento
                      </div>
                      {selectedPneusForFatura.length > 0 && (
                        <span className="pneu-badge" style={{ background: 'var(--primary-color)', color: 'white', fontSize: '0.75rem', padding: '0.1rem 0.6rem' }}>
                          {selectedPneusForFatura.length} selecionado(s)
                        </span>
                      )}
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px', cursor: 'pointer' }} onClick={handleSelectAllPneus}>
                            <div style={{ 
                              width: '18px', 
                              height: '18px', 
                              borderRadius: '4px', 
                              border: '2px solid #cbd5e1', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              background: osResults.length > 0 && osResults.every(p => selectedPneusForFatura.includes(p.pneu_id)) ? 'var(--primary-color)' : 'white' 
                            }}>
                              {osResults.length > 0 && osResults.every(p => selectedPneusForFatura.includes(p.pneu_id)) && <CheckCircle size={12} color="white" />}
                            </div>
                          </th>
                          <th>ID Pneu</th>
                          <th>OS</th>
                          <th>Cliente</th>
                          <th>Medida</th>
                          <th>Vr Serv</th>
                          <th style={{ textAlign: 'center' }}>Fat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {osResults.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                              {loading ? 'Buscando...' : 'Utilize a busca acima para encontrar pneus.'}
                            </td>
                          </tr>
                        ) : (
                          osResults.map(p => (
                            <tr 
                              key={p.pneu_id} 
                              onClick={() => faturaModalMode !== 'view' && handleTogglePneuSelection(p.pneu_id)}
                              style={{ cursor: faturaModalMode === 'view' ? 'default' : 'pointer', background: selectedPneusForFatura.includes(p.pneu_id) ? 'rgba(37, 99, 235, 0.05)' : 'transparent' }}
                            >
                              <td>
                                <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedPneusForFatura.includes(p.pneu_id) ? 'var(--primary-color)' : 'white' }}>
                                  {selectedPneusForFatura.includes(p.pneu_id) && <CheckCircle size={12} color="white" />}
                                </div>
                              </td>
                              <td><span className="pneu-badge" style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>{p.pneu_id}</span></td>
                              <td>#{p.numos}</td>
                              <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>{p.contato_nome}</td>
                              <td style={{ fontSize: '0.85rem' }}>{p.medida_nome}</td>
                              <td style={{ fontWeight: '700', color: '#10b981' }}>R$ {parseFloat(p.vrservico || 0).toFixed(2)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`status-badge status-${p.statusfat ? 'finalizada' : 'aberta'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                  {p.statusfat ? 'SIM' : 'NÃO'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

              {activeFaturaModalTab === 'dados' && (
                <div className="animate-fade-in">
                  <div className="premium-master-panel" style={{ marginBottom: '1.5rem' }}>
                    <div className="premium-section-title"><FileText size={18} /> Dados Gerais da Fatura</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group span-2">
                      <label>Cliente</label>
                      <input type="text" className="form-input" value={faturaForm.cliente_nome} readOnly style={{ background: '#f8fafc', fontWeight: '700' }} />
                    </div>
                    <div className="form-group">
                       <label><Clock size={14} /> Data Faturamento</label>
                       <input type="date" className="form-input" value={faturaForm.datafat} onChange={e => setFaturaForm({...faturaForm, datafat: e.target.value})} disabled={faturaModalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label><User size={14} /> Vendedor</label>
                      <select 
                        className="form-input" 
                        value={String(faturaForm.id_vendedor ?? "")} 
                        onChange={e => setFaturaForm({...faturaForm, id_vendedor: e.target.value === "" ? null : parseInt(e.target.value)})}
                        disabled={faturaModalMode === 'view'}
                      >
                        <option value="">Selecione o vendedor...</option>
                        {vendedores.map(v => (
                          <option key={v.id} value={String(v.id)}>{v.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  </div>

                  <div className="premium-master-panel" style={{ marginBottom: '1.5rem' }}>
                    <div className="premium-section-title"><Wrench size={18} /> Detalhamento de Serviços</div>
                    <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <table className="data-table small" style={{ fontSize: '0.8rem' }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th>Pneu</th>
                            <th>Descrição do Serviço</th>
                            <th style={{ textAlign: 'right' }}>V. Unit</th>
                            <th style={{ textAlign: 'center' }}>Qte</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pneuServicosPreview.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                Nenhum serviço encontrado para os pneus selecionados.
                              </td>
                            </tr>
                          ) : (
                            pneuServicosPreview.map((item, idx) => (
                              <tr key={item.id || idx}>
                                <td><span className="pneu-badge" style={{ fontSize: '0.7rem' }}>#{item.id_pneu}</span></td>
                                <td style={{ fontWeight: '600' }}>{item.servico_descricao || item.descricao}</td>
                                <td style={{ textAlign: 'right' }}>R$ {parseFloat(item.valor || 0).toFixed(2)}</td>
                                <td style={{ textAlign: 'center' }}>{parseFloat(item.quant || 1).toFixed(0)}</td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-color)' }}>
                                  R$ {parseFloat(item.vrtotal || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {pneuServicosPreview.length > 0 && (
                          <tfoot style={{ background: '#f8fafc', fontWeight: '700' }}>
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'right' }}>Soma dos Serviços:</td>
                              <td style={{ textAlign: 'right' }}>
                                R$ {pneuServicosPreview.reduce((acc, curr) => acc + parseFloat(curr.vrtotal || 0), 0).toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>


                  <div className="premium-master-panel" style={{ marginBottom: '1.5rem' }}>
                    <div className="premium-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} /> Laudos Vinculados
                      </div>
                      {faturaModalMode !== 'view' && (
                        <button className="btn-primary" onClick={() => setIsLaudoModalOpen(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          <Plus size={14} /> Vincular Laudo
                        </button>
                      )}
                    </div>
                    <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <table className="data-table small" style={{ fontSize: '0.8rem' }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ padding: '1rem 0.5rem' }}>ID Laudo</th>
                            <th style={{ padding: '1rem 0.5rem' }}>Nº Laudo</th>
                            <th style={{ padding: '1rem 0.5rem' }}>Pneu</th>
                            <th style={{ textAlign: 'right', padding: '1rem 0.5rem' }}>Vr. Crédito</th>
                            <th style={{ textAlign: 'right', padding: '1rem 0.5rem' }}>Saldo</th>
                            <th style={{ textAlign: 'right', padding: '1rem 0.5rem' }}>Valor Aplicado</th>
                            <th style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faturaLaudosPreview.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                Nenhum laudo vinculado a esta fatura.
                              </td>
                            </tr>
                          ) : (
                            faturaLaudosPreview.map((item) => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1.2rem 0.5rem' }}>#{item.id_laudo}</td>
                                <td style={{ fontWeight: '600', padding: '1.2rem 0.5rem' }}>{item.numlaudo}</td>
                                <td style={{ padding: '1.2rem 0.5rem' }}><span className="pneu-badge" style={{ fontSize: '0.8rem' }}>#{item.pneu_id}</span></td>
                                <td style={{ textAlign: 'right', padding: '1.2rem 0.5rem' }}>R$ {parseFloat(item.vrcredito || 0).toFixed(2)}</td>
                                <td style={{ textAlign: 'right', padding: '1.2rem 0.5rem' }}>R$ {parseFloat(item.vrsaldo || 0).toFixed(2)}</td>
                                <td style={{ textAlign: 'right' }}>
                                  {faturaModalMode === 'view' ? (
                                    <span style={{ fontWeight: '700', color: '#dc2626' }}>
                                      - R$ {parseFloat(item.valor || 0).toFixed(2)}
                                    </span>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                      <span style={{ fontSize: '1rem', color: '#dc2626', fontWeight: '800' }}>R$</span>
                                      <input 
                                        type="text" 
                                        className="form-input" 
                                        style={{ width: '120px', textAlign: 'right', padding: '0.5rem 0.8rem', height: '42px', fontSize: '1.2rem', fontWeight: '800', color: '#dc2626', border: '2px solid #3b82f6', borderRadius: '6px', background: '#fef2f2', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)' }}
                                        value={item.valor}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(',', '.');
                                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                            handleInlineUpdateLaudoValue(item.id, val);
                                          }
                                        }}
                                        onBlur={(e) => handleSaveLaudoValue(item.id, parseFloat(e.target.value) || 0)}
                                      />
                                    </div>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {faturaModalMode !== 'view' && (
                                    <button className="icon-btn delete" onClick={() => handleDeleteFaturaLaudo(item.id)} title="Remover vínculo">
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {faturaLaudosPreview.length > 0 && (
                          <tfoot style={{ background: '#f8fafc', fontWeight: '700' }}>
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'right' }}>Total Crédito Aplicado:</td>
                              <td style={{ textAlign: 'right', color: '#dc2626' }}>
                                - R$ {faturaLaudosPreview.reduce((acc, curr) => acc + parseFloat(curr.valor || 0), 0).toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>

                  <div className="premium-master-panel" style={{ background: '#f8fafc' }}>
                    <div className="premium-section-title"><DollarSign size={18} /> Totais e Fechamento</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                      <label>Valor Serviços</label>
                      <input type="number" className="form-input" value={faturaForm.vrservico} readOnly style={{ background: '#f8fafc' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#10b981', fontWeight: '700' }}>(-) Crédito Laudo</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={faturaLaudosPreview.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0)} 
                        readOnly 
                        style={{ background: '#ecfdf5', color: '#10b981', fontWeight: '800' }} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Adicional Produtos</label>
                      <input type="number" className="form-input" value={faturaForm.vrproduto} onChange={e => setFaturaForm({...faturaForm, vrproduto: parseFloat(e.target.value) || 0})} disabled={faturaModalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label>Carcaça / Montagem</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="number" className="form-input" placeholder="Carcaça" value={faturaForm.vrcarcaca} onChange={e => setFaturaForm({...faturaForm, vrcarcaca: parseFloat(e.target.value) || 0})} disabled={faturaModalMode === 'view'} />
                        <input type="number" className="form-input" placeholder="Montagem" value={faturaForm.vrmontagem} onChange={e => setFaturaForm({...faturaForm, vrmontagem: parseFloat(e.target.value) || 0})} disabled={faturaModalMode === 'view'} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Bônus / Desconto</label>
                      <input type="number" className="form-input" value={faturaForm.vrbonus} onChange={e => setFaturaForm({...faturaForm, vrbonus: parseFloat(e.target.value) || 0})} style={{ color: '#dc2626', fontWeight: '700' }} disabled={faturaModalMode === 'view'} />
                    </div>
                    <div className="form-group span-2">
                      <label>Observações</label>
                      <textarea className="form-input" rows={3} value={faturaForm.obs} onChange={e => setFaturaForm({...faturaForm, obs: e.target.value})} disabled={faturaModalMode === 'view'} />
                    </div>

                    <div className="form-group">
                      <label><Home size={14} /> Banco da Fatura</label>
                      <select 
                        className="form-input" 
                        value={String(faturaForm.id_banco ?? "")} 
                        onChange={e => setFaturaForm({...faturaForm, id_banco: e.target.value === "" ? null : parseInt(e.target.value)})}
                        disabled={faturaModalMode === 'view'}
                      >
                        <option value="">Selecione o banco...</option>
                        {bancos.map(b => (
                          <option key={b.id} value={String(b.id)}>{b.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label><Book size={14} /> Tipo de Documento</label>
                      <select 
                        className="form-input" 
                        value={String(faturaForm.id_tipodocto ?? "")} 
                        onChange={e => setFaturaForm({...faturaForm, id_tipodocto: e.target.value === "" ? null : parseInt(e.target.value)})}
                        disabled={faturaModalMode === 'view'}
                      >
                        <option value="">Selecione o tipo...</option>
                        {tiposDocto.map(t => (
                          <option key={t.id} value={String(t.id)}>{t.descricao}</option>
                        ))}
                      </select>
                    </div>



                    <div className="form-group span-2">
                      <label><CreditCard size={14} /> Plano de Pagamento</label>
                      <select 
                        className="form-input" 
                        value={String(faturaForm.id_planopag ?? "")} 
                        onChange={e => setFaturaForm({...faturaForm, id_planopag: e.target.value === "" ? null : parseInt(e.target.value)})}
                        disabled={faturaModalMode === 'view'}
                      >
                        <option value="">Selecione...</option>
                        {allPlanosPag.map(pl => (
                          <option key={pl.id} value={String(pl.id)}>{pl.formapag}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Grid de Parcelas da Fatura */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                      <Calendar size={16} /> Parcelamento Previsto (fatura_parcela)
                    </h4>
                    <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <table className="data-table small" style={{ fontSize: '0.8rem' }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th style={{ width: '80px', textAlign: 'center' }}>Parcela</th>
                            <th>Vencimento</th>
                            <th style={{ textAlign: 'right' }}>Valor</th>
                            <th>Tipo Docto</th>
                            <th style={{ textAlign: 'center' }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faturaParcelasPreview.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                                Selecione um plano de pagamento para visualizar as parcelas.
                              </td>
                            </tr>
                          ) : (
                            faturaParcelasPreview.map((p, idx) => (
                              <tr key={idx}>
                                <td style={{ textAlign: 'center' }}>
                                  <span style={{ background: '#e2e8f0', padding: '0.1rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {p.num_parcela}ª
                                  </span>
                                </td>
                                <td style={{ fontWeight: '500' }}>
                                  {new Date(p.vencto).toLocaleDateString()}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                  R$ {parseFloat(p.valor || 0).toFixed(2)}
                                </td>
                                <td>
                                  {tiposDocto.find(t => t.id === p.id_tipodocto)?.descricao || '---'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                   <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                      <button className="btn-icon" onClick={() => handleEditParcela(idx)} title="Visualizar Detalhes" style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <Eye size={14} />
                                      </button>
                                      {faturaModalMode !== 'view' && (
                                        <>
                                          <button className="btn-icon" onClick={() => handleEditParcela(idx)} title="Editar Parcela" style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <Edit size={14} />
                                          </button>
                                          <button className="btn-icon" onClick={() => handleDeleteParcela(idx)} title="Excluir Parcela" style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                          </button>
                                        </>
                                      )}
                                   </div>
                                 </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>


                  </div>
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#1e293b', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.3)' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600', opacity: 0.9 }}>TOTAL FINAL DA FATURA:</span>
                    <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#10b981' }}>
                      R$ {(
                        faturaForm.vrservico + 
                        faturaForm.vrproduto + 
                        faturaForm.vrcarcaca + 
                        faturaForm.vrmontagem - 
                        faturaForm.vrbonus -
                        faturaLaudosPreview.reduce((acc, curr) => acc + parseFloat(curr.valor || 0), 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="premium-modal-footer">
              <button className="btn-secondary" onClick={() => setIsFaturaModalOpen(false)}>{faturaModalMode === 'view' ? 'Fechar' : 'Cancelar'}</button>
              {faturaModalMode !== 'view' && (
                activeFaturaModalTab === 'pneus' ? (
                  <button className="btn-primary" onClick={handleProceedToFaturaDetails} disabled={loading}>
                    {loading ? 'Processando...' : 'Próximo: Dados da Fatura'} <ChevronRight size={18} />
                  </button>
                ) : (
                  <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleSaveFatura}>
                    <CheckCircle size={18} /> {editingFatura ? 'Salvar Alterações' : 'Gerar Fatura Agora'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    
      {/* Modal de Edição de Parcela */}
      {isEditParcelaModalOpen && (
        <div className="os-modal-overlay" onClick={() => setIsEditParcelaModalOpen(false)}>
          <div className="premium-modal-content medium" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="premium-modal-header">
              <h2>Editar Parcela #{editingParcelaData.num_parcela}</h2>
              <button className="close-btn" onClick={() => setIsEditParcelaModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body" style={{ padding: '2rem', background: '#f8fafc' }}>
              <div className="premium-master-panel" style={{ padding: '1.5rem', marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label><Calendar size={14} /> Data de Vencimento</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editingParcelaData.vencto} 
                    onChange={e => setEditingParcelaData({...editingParcelaData, vencto: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label><DollarSign size={14} /> Valor da Parcela (R$)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingParcelaData.valor} 
                    onChange={e => setEditingParcelaData({...editingParcelaData, valor: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                <div className="form-group" style={{ marginTop: '1.2rem' }}>
                  <label><FileText size={14} /> Tipo de Documento</label>
                  <select 
                    className="form-input" 
                    value={String(editingParcelaData.id_tipodocto ?? "")} 
                    onChange={e => setEditingParcelaData({...editingParcelaData, id_tipodocto: e.target.value === "" ? null : parseInt(e.target.value)})}
                  >
                    <option value="">Selecione o tipo...</option>
                    {tiposDocto.map(t => (
                      <option key={t.id} value={String(t.id)}>{t.descricao}</option>
                    ))}
                  </select>
                </div>
                </div>
              </div>
            <div className="premium-modal-footer">
              <button className="btn-secondary" onClick={() => setIsEditParcelaModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveEditedParcela}>Salvar Parcela</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Vincular Laudo */}
      {isLaudoModalOpen && (
        <div className="os-modal-overlay" onClick={() => { setIsLaudoModalOpen(false); setSelectedLaudoForLinking(null); setLaudoSearchQuery(''); }}>
          <div className="premium-modal-content medium" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', minHeight: '400px' }}>
            <div className="premium-modal-header">
              <h2>Vincular Laudo de Garantia</h2>
              <button className="close-btn" onClick={() => { setIsLaudoModalOpen(false); setSelectedLaudoForLinking(null); setLaudoSearchQuery(''); }}><X size={24} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', background: '#f8fafc' }}>
              <div className="premium-master-panel" style={{ padding: '1.5rem', marginBottom: 0 }}>
              <div className="form-group">
                <label style={{ fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>ID do Laudo</label>
                <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Hash style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="ID..." 
                      style={{ paddingLeft: '2.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                      value={laudoSearchQuery}
                      onChange={(e) => handleSearchLaudos(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button 
                    className="btn-primary" 
                    title="Buscar laudos deste cliente"
                    style={{ width: '45px', padding: 0, justifyContent: 'center', background: '#3b82f6' }}
                    onClick={handleFetchClientLaudos}
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              {showClientLaudosList && (
                <div className="animate-fade-in" style={{ marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Laudos com Saldo (Cliente)</span>
                    <button onClick={() => setShowClientLaudosList(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={14} /></button>
                  </div>
                  <div style={{ maxHieght: '200px', overflowY: 'auto', background: 'white' }}>
                    {clientLaudos.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>Nenhum laudo com saldo encontrado.</div>
                    ) : (
                      clientLaudos.map(l => (
                        <div 
                          key={l.id} 
                          className="suggestion-item" 
                          onClick={() => handleSelectLaudoFromList(l)}
                          style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>ID {l.id} - Laudo #{l.numlaudo}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Série: {l.numserie || '---'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#10b981' }}>R$ {parseFloat(l.vrsaldo || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {selectedLaudoForLinking ? (
                <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Nº Laudo</label>
                      <span style={{ fontWeight: '700', fontSize: '1rem' }}>{selectedLaudoForLinking.numlaudo}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Saldo Disponível</label>
                      <span style={{ fontWeight: '700', fontSize: '1rem', color: '#10b981' }}>R$ {parseFloat(selectedLaudoForLinking.vrsaldo || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b', display: 'block', marginBottom: '0.5rem' }}>
                      VALOR APLICADO NESTA FATURA (R$):
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ fontSize: '1.4rem', height: '45px', fontWeight: '800', color: '#dc2626', textAlign: 'right' }}
                      value={linkingLaudoValue}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setLinkingLaudoValue(val as any);
                        }
                      }}
                    />
                  </div>

                  <button 
                    className="btn-primary" 
                    disabled={loading}
                    style={{ width: '100%', marginTop: '1rem', background: '#10b981', height: '45px', fontSize: '1rem', fontWeight: '700' }} 
                    onClick={handleConfirmAddLaudo}
                  >
                    {loading ? 'Processando...' : 'Vincular Laudo e Salvar'}
                  </button>
                </div>
              ) : laudoSearchQuery.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', textAlign: 'center', color: '#ef4444', background: '#fef2f2', borderRadius: '8px', fontSize: '0.85rem' }}>
                  Aguardando ID válido ou laudo não encontrado...
                </div>
              )}
                </div>
              </div>
            <div className="premium-modal-footer">
              <button className="btn-secondary" onClick={() => { setIsLaudoModalOpen(false); setSelectedLaudoForLinking(null); setLaudoSearchQuery(''); }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
      {/* Report List Layout (Hidden on screen, visible on print) */}
      <div className="report-list-container only-print">
        <div className="report-list-header">
          <div className="report-header-main">
            <div className="report-logo-box">
              <img src={logoEmpresa} alt="Logo" />
            </div>
            <div className="report-company-info">
              <h2>{empresa?.razaosocial || 'TOTALCAP RECAPAGEM'}</h2>
              <p className="company-subtitle">SOLUÇÕES EM RECAPAGEM DE PNEUS</p>
            </div>
            <div className="report-meta-info">
              <div className="meta-item">
                <span className="meta-label">Data:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Hora:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Usuário:</span>
                <span>ADMIN</span>
              </div>
            </div>
          </div>
          
          <div className="report-title-bar">
            <h1>RELATÓRIO DE FATURAS</h1>
            <div className="report-filter-info">
              Listagem Geral de Faturas Gerenciadas
            </div>
          </div>
        </div>

        <table className="report-modern-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th style={{ width: '100px' }}>Data Fat</th>
              <th>Vendedor</th>
              <th>Cliente</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {faturas.map(f => (
              <tr key={f.id}>
                <td className="cell-id">#{f.id}</td>
                <td>{new Date(f.datafat).toLocaleDateString()}</td>
                <td>{f.vendedor_nome || '---'}</td>
                <td className="cell-client">{f.contato_nome}</td>
                <td className="cell-value">R$ {parseFloat(f.vrtotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="footer-count">
                Total de {faturas.length} faturas listadas
              </td>
              <td className="footer-label">SOMA TOTAL:</td>
              <td className="footer-value">
                R$ {faturas.reduce((acc, curr) => acc + parseFloat(curr.vrtotal || 0), 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="report-list-footer">
          <span>Sistema Totalcap - Gestão Especializada em Recapagem</span>
          <span>Página 1 de 1</span>
        </div>
      </div>

      {/* Single Fatura Print Layout */}
      {faturaToPrint && (
        <div className="fatura-print-wrapper only-print">
          <div className="fatura-print-header">
            <div className="print-logo">
              <img src={logoEmpresa} alt="Logo" />
            </div>
            <div className="print-company-info">
              <h2>{empresa?.razaosocial || 'TOTALCAP RECAPAGEM'}</h2>
              <p>{empresa?.rua}, {empresa?.numcasa} - {empresa?.bairro}</p>
              <p>{empresa?.cidade} - {empresa?.uf} | Fone: {empresa?.telefone}</p>
              <p>CNPJ: {empresa?.cnpj}</p>
            </div>
            <div className="print-doc-info">
              <div className="doc-title">FATURA</div>
              <div className="doc-number">#{faturaToPrint.numfatura || faturaToPrint.id}</div>
              <div className="doc-date">{new Date(faturaToPrint.datafat).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="print-section">
            <div className="section-title">DADOS DO CLIENTE</div>
            <div className="client-info-grid">
              <div><strong>Cliente:</strong> {faturaToPrint.contato_nome || faturaToPrint.cliente_nome}</div>
              <div><strong>Vendedor:</strong> {faturaToPrint.vendedor_nome || '---'}</div>
            </div>
          </div>

          <div className="print-section">
            <div className="section-title">SERVIÇOS / PNEUS</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Pneu</th>
                  <th>Serviço / Descrição</th>
                  <th style={{ textAlign: 'right' }}>V. Unit</th>
                  <th style={{ textAlign: 'center' }}>Qte</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {faturaToPrint.pneus?.map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td>#{p.id_pneu}</td>
                    <td>{p.servico_descricao || p.descricao}</td>
                    <td style={{ textAlign: 'right' }}>R$ {parseFloat(p.valor || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{parseFloat(p.quant || 1).toFixed(0)}</td>
                    <td style={{ textAlign: 'right' }}>R$ {parseFloat(p.vrtotal || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {faturaToPrint.laudos?.length > 0 && (
            <div className="print-section">
              <div className="section-title">LAUDOS VINCULADOS</div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>ID Laudo</th>
                    <th>Nº Laudo</th>
                    <th>Pneu</th>
                    <th style={{ textAlign: 'right' }}>Crédito</th>
                  </tr>
                </thead>
                <tbody>
                  {faturaToPrint.laudos.map((l: any, idx: number) => (
                    <tr key={idx}>
                      <td>#{l.id_laudo}</td>
                      <td>{l.numlaudo}</td>
                      <td>#{l.pneu_id}</td>
                      <td style={{ textAlign: 'right' }}>R$ {parseFloat(l.vraply || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="print-section">
            <div className="section-title">PARCELAMENTO</div>
            <div className="parcelas-flex">
              {faturaToPrint.parcelas?.map((p: any, idx: number) => (
                <div key={idx} className="parcela-card">
                  <div className="p-num">{p.num_parcela}ª</div>
                  <div className="p-date">{new Date(p.vencto).toLocaleDateString()}</div>
                  <div className="p-value">R$ {parseFloat(p.valor || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="print-footer-totals">
            <div className="totals-column">
              <div className="total-item"><span>Serviços:</span> <span>R$ {parseFloat(faturaToPrint.vrservico || 0).toFixed(2)}</span></div>
              <div className="total-item"><span>Produtos:</span> <span>R$ {parseFloat(faturaToPrint.vrproduto || 0).toFixed(2)}</span></div>
              <div className="total-item"><span>Descontos:</span> <span style={{ color: '#dc2626' }}>- R$ {parseFloat(faturaToPrint.vrbonus || 0).toFixed(2)}</span></div>
            </div>
            <div className="grand-total-box">
              <div className="gt-label">TOTAL DA FATURA</div>
              <div className="gt-value">R$ {parseFloat(faturaToPrint.vrtotal || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="print-signatures">
            <div className="sig-line">ASSINATURA DO CLIENTE</div>
            <div className="sig-line">CONFERIDO POR</div>
          </div>
        </div>
      )}
    </div>
  );
}

