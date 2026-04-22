import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Search, Printer, DollarSign, FileText, 
  Calculator, Hash, User, Package, ChevronRight,
  TrendingUp, CheckCircle, Clock, Plus, Trash2, X, Settings, Activity, Wrench, Calendar, Home, Book, Edit, Eye
} from 'lucide-react';
import api from '../lib/api';
import './Faturamento.css';

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

  // Aba 1: Informe de Serviços (Busca por Pneu)
  const [pneuSearchQuery, setPneuSearchQuery] = useState('');
  const [pneuResults, setPneuResults] = useState<PneuSearchResult[]>([]);

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
  const [editingParcelaData, setEditingParcelaData] = useState({ num_parcela: 0, vencto: '', valor: 0 });
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
    } catch (err) {
      alert("Erro ao excluir fatura.");
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
      setActiveFaturaModalTab('pneus');
    }
    setIsFaturaModalOpen(true);
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
        // Lê os serviços informados na tabela pneu_servico
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
          const total = faturaForm.vrservico + faturaForm.vrproduto + faturaForm.vrcarcaca + faturaForm.vrmontagem - faturaForm.vrbonus;
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
  }, [faturaForm.id_planopag, faturaForm.id_tipodocto, faturaForm.vrservico, faturaForm.vrproduto, faturaForm.vrcarcaca, faturaForm.vrmontagem, faturaForm.vrbonus, faturaForm.datafat, allPlanosPag, isFaturaModalOpen, editingFatura]);


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
        vrtotal: (faturaForm.vrservico + faturaForm.vrproduto + faturaForm.vrcarcaca + faturaForm.vrmontagem - faturaForm.vrbonus)
      };

      if (editingFatura) {
        await api.put(`/faturas/${editingFatura.id}`, payload);
        alert("Fatura atualizada com sucesso!");
      } else {
        await api.post('/faturas/', payload);
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
      let url = '/ordens-servico/pneus-pendentes/?';
      const params = new URLSearchParams();
      if (searchParams.id_pneu) params.append('pneu_id', searchParams.id_pneu);
      if (searchParams.numos) params.append('numos', searchParams.numos);
      if (searchParams.cliente) params.append('cliente', searchParams.cliente);

      const response = await api.get(url + params.toString());
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
    setTimeout(() => {
      document.getElementById('os-search-form')?.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }, 50);
  };

  return (
    <div className="faturamento-container">
      <div className="page-header">
        <h1 className="title">Faturamento</h1>
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
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingServico ? 'Alterar Serviço' : 'Lançar Novo Serviço'}</h2>
              <button className="close-btn" onClick={() => setIsServicoModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
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
            <div className="modal-footer">
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
              <div className="search-grid" style={{ gridTemplateColumns: '1fr auto auto', gap: '1rem' }}>
                <div className="form-group">
                  <label><Search size={14} /> Buscar Fatura (Número ou Cliente)</label>
                  <div className="input-with-button">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Digite o número da fatura ou nome do cliente..." 
                      value={faturaSearchQuery}
                      onChange={(e) => setFaturaSearchQuery(e.target.value)}
                    />
                    <button className="btn-search-producao" onClick={fetchFaturas}>
                      {faturaLoading ? '...' : <><Search size={22} /> Buscar</>}
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
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
                             <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhuma fatura encontrada.</td>
                             </tr>
                          ) : (
                             faturas.map(f => (
                                <tr 
                                  key={f.id} 
                                  onClick={() => setSelectedFatura(f)}
                                  className={selectedFatura?.id === f.id ? 'selected-row' : ''}
                                  style={{ cursor: 'pointer', background: selectedFatura?.id === f.id ? 'rgba(37, 99, 235, 0.05)' : 'transparent' }}
                                >
                                   <td><span className="os-number">#{f.id}</span></td>
                                   <td>{new Date(f.datafat).toLocaleDateString()}</td>
                                   <td style={{ fontWeight: '500' }}>{f.vendedor_nome || '---'}</td>
                                   <td style={{ fontWeight: '600' }}>{f.contato_nome}</td>
                                   <td style={{ fontWeight: '700', color: '#10b981' }}>R$ {parseFloat(f.vrtotal || 0).toFixed(2)}</td>
                                   <td>
                                      <div className="action-buttons" onClick={e => e.stopPropagation()}>
                                         <button className="icon-btn view" title="Visualizar Detalhes" onClick={() => handleOpenFaturaModal(f, 'view')}><Eye size={18} /></button>
                                         <button className="icon-btn edit" title="Editar Fatura" onClick={() => handleOpenFaturaModal(f, 'edit')}><Edit size={18} /></button>
                                         <button className="icon-btn delete" title="Excluir Fatura" onClick={() => handleDeleteFatura(f.id)}><Trash2 size={16} /></button>
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
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header" style={{ background: 'var(--primary-color)', color: 'white' }}>
              <h2>Cálculo de Fatura - OS #{selectedOSForBilling.numos}</h2>
              <button className="close-btn" style={{ color: 'white' }} onClick={() => setIsBillingModalOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="glass-panel" style={{ marginBottom: '1.5rem', background: 'rgba(37, 99, 235, 0.05)' }}>
                <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>Cliente: {selectedOSForBilling.contato_nome}</p>
              </div>

              <div className="billing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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

              <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#1e293b', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', opacity: 0.9 }}>Valor Total da Fatura:</span>
                <span style={{ fontSize: '1.8rem', fontWeight: '800' }}>R$ {calculateBillingTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-footer">
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
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', height: '90vh' }}>
            <div className="modal-header" style={{ background: '#1e293b', color: 'white' }}>
              <h2>{faturaModalMode === 'view' ? `Visualizando Fatura #${editingFatura?.numfatura || editingFatura?.id}` : editingFatura ? `Editar Fatura #${editingFatura.numfatura || editingFatura.id}` : 'Nova Fatura Manual'}</h2>
              <button className="close-btn" style={{ color: 'white' }} onClick={() => setIsFaturaModalOpen(false)}><X size={24} /></button>
            </div>

            {/* Sub-tabs da Modal */}
            <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button 
                className={`modal-tab-btn ${activeFaturaModalTab === 'pneus' ? 'active' : ''}`}
                onClick={() => setActiveFaturaModalTab('pneus')}
                style={{ padding: '1rem 2rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700', color: activeFaturaModalTab === 'pneus' ? 'var(--primary-color)' : '#64748b', borderBottom: activeFaturaModalTab === 'pneus' ? '2px solid var(--primary-color)' : 'none' }}
              >
                1. Seleção de Pneus
              </button>
              <button 
                className={`modal-tab-btn ${activeFaturaModalTab === 'dados' ? 'active' : ''}`}
                onClick={() => setActiveFaturaModalTab('dados')}
                style={{ padding: '1rem 2rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700', color: activeFaturaModalTab === 'dados' ? 'var(--primary-color)' : '#64748b', borderBottom: activeFaturaModalTab === 'dados' ? '2px solid var(--primary-color)' : 'none' }}
              >
                2. Dados da Fatura
              </button>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {activeFaturaModalTab === 'pneus' && (
                <div className="animate-fade-in">
                  <div className="search-section glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                    <form onSubmit={handleOSSearch} className="search-form-producao">
                      <div className="search-grid" style={{ gridTemplateColumns: '80px 100px 1fr auto' }}>
                        <div className="form-group">
                          <label><Hash size={12} /> ID OS</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="ID"
                            value={searchParams.id}
                            onChange={(e) => setSearchParams({...searchParams, id: e.target.value, numos: '', cliente: '', id_pneu: ''})}
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
                            onChange={(e) => setSearchParams({...searchParams, numos: e.target.value, id: '', cliente: '', id_pneu: ''})}
                            disabled={faturaModalMode === 'view'}
                          />
                        </div>
                        <div className="form-group relative">
                          <label><User size={12} /> Nome do Cliente</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Digite o nome..." 
                            value={searchParams.cliente}
                            onChange={handleClienteChange}
                            onFocus={() => faturaModalMode !== 'view' && searchParams.cliente.length >= 2 && setShowSuggestions(true)}
                            disabled={faturaModalMode === 'view'}
                          />
                          {showSuggestions && filteredClientes.length > 0 && (
                            <div className="suggestions-dropdown" style={{ top: '100%' }}>
                              {filteredClientes.map(c => (
                                <div key={c.id} className="suggestion-item" onClick={() => selectCliente(c.nome)}>
                                  <User size={14} />
                                  <span>{c.nome}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                          <button type="submit" className="btn-search-producao" disabled={loading || faturaModalMode === 'view'} style={{ height: '42px', width: '42px', padding: 0, justifyContent: 'center' }}>
                            {loading ? '...' : <Search size={20} />}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={18} /> Pneus Prontos para Faturamento
                    {selectedPneusForFatura.length > 0 && (
                      <span className="pneu-badge" style={{ background: 'var(--primary-color)', color: 'white', fontSize: '0.75rem', padding: '0.1rem 0.6rem' }}>
                        {selectedPneusForFatura.length} selecionado(s)
                      </span>
                    )}
                  </h4>

                  <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}></th>
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
              )}

              {activeFaturaModalTab === 'dados' && (
                <div className="animate-fade-in">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group span-2">
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

                  {/* Grid de Serviços da Fatura */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                      <Wrench size={16} /> Detalhamento de Serviços (fatura_servico)
                    </h4>
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

                  <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                      <label>Valor Serviços</label>
                      <input type="number" className="form-input" value={faturaForm.vrservico} readOnly style={{ background: '#f8fafc' }} />
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
                                   {faturaModalMode !== 'view' && (
                                     <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                                       <button className="btn-icon" onClick={() => handleEditParcela(idx)} title="Editar" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                         <Edit size={14} />
                                       </button>
                                       <button className="btn-icon" onClick={() => handleDeleteParcela(idx)} title="Excluir" style={{ background: '#fee2e2', color: '#ef4444' }}>
                                         <Trash2 size={14} />
                                       </button>
                                     </div>
                                   )}
                                 </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#1e293b', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', opacity: 0.9 }}>TOTAL FINAL:</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: '800' }}>
                      R$ {(faturaForm.vrservico + faturaForm.vrproduto + faturaForm.vrcarcaca + faturaForm.vrmontagem - faturaForm.vrbonus).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
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
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Editar Parcela {editingParcelaData.num_parcela}ª</h3>
              <button className="close-btn" onClick={() => setIsEditParcelaModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>Data de Vencimento</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  value={editingParcelaData.vencto} 
                  onChange={e => setEditingParcelaData({...editingParcelaData, vencto: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>Valor da Parcela (R$)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  value={editingParcelaData.valor} 
                  onChange={e => setEditingParcelaData({...editingParcelaData, valor: parseFloat(e.target.value) || 0})} 
                />
              </div>
              <div className="form-group" style={{ marginTop: '1.2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>Tipo de Documento</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
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
            <div className="modal-footer" style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc' }}>
              <button className="btn-secondary" onClick={() => setIsEditParcelaModalOpen(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveEditedParcela} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: '#2563eb', color: 'white', border: 'none' }}>Salvar Parcela</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
