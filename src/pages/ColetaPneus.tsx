import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Plus, Trash2, Edit2, Eye, X, DollarSign, Shield, Info, ClipboardList, Printer, Camera, Loader2, AlertCircle, User, FilePlus, Calendar, Save } from 'lucide-react';
import api from '../lib/api';
import './ColetaPneus.css';
import LogoDbnet from '../assets/images/LogoEmpresa.png';

const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
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

interface MobPneu {
  id?: number;
  id_mobos?: number;
  id_medida: number;
  id_marca: number;
  id_desenho: number;
  id_recap: number;
  valor: number;
  piso: string;
  numserie: string;
  numfogo: string;
  dot: string;
  doriginal: string;
  qreforma: number;
  uso: string;
  garantia: string;
  obs: string;
  medidanova: string;
  marcanova: string;
  desenhonovo: string;
}

interface MobOS {
  id: number;
  id_contato: number;
  dataos: string;
  qpneu: number;
  vtotal: number;
  msgmob: string;
  id_vendedor: number;
  datalan: string;
  status: string;
  pneus: MobPneu[];
  contato?: { nome: string };
  vendedor?: { nome: string };
  numos: string;
  cpfcnpj: string;
  nome: string;
  endereco: string;
  cidade: string;
  uf: string;
  fone: string;
  veiculo: string;
  formapagto: string;
  vendedor_ocr: string;
  servicocomgarantia: string;
  tipoveiculo: string;
  somentesepar: string;
  podealterardesenho: string;
}

export default function ColetaPneus() {
  const [coletas, setColetas] = useState<MobOS[]>([]);
  const [filteredColetas, setFilteredColetas] = useState<MobOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();
  
  // Lookups
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [desenhos, setDesenhos] = useState<any[]>([]);
  const [tiposRecap, setTiposRecap] = useState<any[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);

  // Modal State com Recuperação Instantânea
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(() => {
    try {
      const saved = sessionStorage.getItem('totalcap_ocr_session') || localStorage.getItem('totalcap_ocr_session');
      if (!saved) return localStorage.getItem('totalcap_ocr_active') === 'true';
      const parsed = JSON.parse(saved);
      return parsed.isOpen || false;
    } catch { return false; }
  });
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem('totalcap_ocr_session') || localStorage.getItem('totalcap_ocr_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed.preview || null;
    } catch { return null; }
  });
  const [ocrResultText, setOcrResultText] = useState('');
  const [ocrInstructions, setOcrInstructions] = useState(() => {
    try {
      const saved = sessionStorage.getItem('totalcap_ocr_session') || localStorage.getItem('totalcap_ocr_session');
      return saved ? JSON.parse(saved).instructions : '';
    } catch { return ''; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  // Form State (MobOS)
  const [formData, setFormData] = useState<any>({
    id_contato: 0,
    msgmob: '',
    id_vendedor: 0,
    pneus: [],
    numos: '',
    cpfcnpj: '',
    nome: '',
    endereco: '',
    cidade: '',
    uf: '',
    fone: '',
    veiculo: '',
    formapagto: '',
    vendedor_ocr: '',
    servicocomgarantia: '',
    tipoveiculo: '',
    somentesepar: '',
    podealterardesenho: '',
    status: ''
  });

  // Pneu Sub-Modal State
  const [isPneuModalOpen, setIsPneuModalOpen] = useState(false);
  const [editingPneuIndex, setEditingPneuIndex] = useState<number | null>(null);
  const [tempPneu, setTempPneu] = useState<MobPneu>({
    id_medida: 0,
    id_marca: 0,
    id_desenho: 0,
    id_recap: 0,
    valor: 0,
    piso: '',
    numserie: '',
    numfogo: '',
    dot: '',
    doriginal: '',
    qreforma: 0,
    uso: '',
    garantia: '',
    obs: '',
    medidanova: '',
    marcanova: '',
    desenhonovo: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // RECUPERAÇÃO DE SESSÃO OCR (Prioridade Máxima para Mobile)
    let hasRecovered = false;
    try {
      const savedSession = sessionStorage.getItem('totalcap_ocr_session') || localStorage.getItem('totalcap_ocr_session');
      if (savedSession) {
        const { preview, instructions, isOpen } = JSON.parse(savedSession);
        if (preview && isOpen) {
          setOcrPreview(preview);
          setOcrInstructions(instructions || '');
          setIsOCRModalOpen(true);
          hasRecovered = true;
        }
      }
    } catch (e) {
      // Ignora erro silenciosamente em produção
    }

    // Só buscamos os dados do grid se não houver um OCR sendo recuperado
    // ou se o sistema estiver rodando normalmente. No mobile, isso evita que o 
    // carregamento do banco de dados (Neon) feche o modal que acabou de abrir.
    if (!hasRecovered) {
      fetchData();
      fetchLookups();
    } else {
      // Se recuperamos algo, carregamos os dados em paralelo mas sem pressa
      fetchData();
      fetchLookups();
    }
  }, []);

  // SALVAMENTO DE SESSÃO OCR (SessionStorage é mais rápido e seguro para imagens grandes)
  useEffect(() => {
    if (isOCRModalOpen && ocrPreview) {
      try {
        const sessionData = JSON.stringify({
          preview: ocrPreview,
          instructions: ocrInstructions,
          isOpen: isOCRModalOpen,
          timestamp: new Date().getTime()
        });
        sessionStorage.setItem('totalcap_ocr_session', sessionData);
        // Mantemos um flag pequeno no localStorage caso a aba feche
        localStorage.setItem('totalcap_ocr_active', 'true');
      } catch (e) {
        console.warn("Imagem muito grande para persistência.");
      }
    }
  }, [isOCRModalOpen, ocrPreview, ocrInstructions]);

  const clearOCRSession = () => {
    sessionStorage.removeItem('totalcap_ocr_session');
    localStorage.removeItem('totalcap_ocr_active');
    localStorage.removeItem('totalcap_ocr_session');
    setOcrPreview(null);
    setOcrResultText('');
    setOcrInstructions('');
    setIsOCRModalOpen(false);
  };

  // Função para comprimir imagem e economizar memória no mobile
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Qualidade 0.7 é ideal para OCR sem perder detalhes essenciais
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };
  useEffect(() => {
    let filtered = [...coletas];

    // Filtro por termo de busca (ID, Cliente, Vendedor, OS)
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        String(c.id).includes(lowerSearch) || 
        (c.contato?.nome || '').toLowerCase().includes(lowerSearch) ||
        (c.vendedor?.nome || '').toLowerCase().includes(lowerSearch) ||
        (c.numos ? String(c.numos) : '').includes(lowerSearch)
      );
    }

    // Filtro por Data (Intervalo)
    if (startDate) {
      filtered = filtered.filter(c => c.dataos && c.dataos >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(c => c.dataos && c.dataos <= endDate);
    }

    setFilteredColetas(filtered);
  }, [searchTerm, startDate, endDate, coletas]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await api.get('/coletas/');
      console.log("Coletas carregadas:", response.data);
      setColetas(response.data);
    } catch (error: any) {
      console.error("Erro ao buscar Coletas:", error);
      setFetchError(error.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    const loadResource = async (path: string, setter: (data: any[]) => void, label: string) => {
      try {
        const response = await api.get(path);
        setter(response.data);
      } catch (error) {
        console.error(`Erro ao buscar ${label}:`, error);
      }
    };

    await Promise.allSettled([
      loadResource('/clientes/', (data) => {
        // Filtrar apenas clientes (flagcliente = true), adaptado dependendo do seu modelo legados
        setClientes(data.filter(c => c.ativo !== false)); 
      }, 'Clientes'),
      loadResource('/vendedores/', setVendedores, 'Vendedores'),
      loadResource('/medidas/', setMedidas, 'Medidas'),
      loadResource('/marcas/', setMarcas, 'Marcas'),
      loadResource('/desenhos/', setDesenhos, 'Desenhos'),
      loadResource('/tipo-recapagem/', setTiposRecap, 'Tipos de Recapagem'),
      api.get('/empresas/').then(res => {
        if (res.data && res.data.length > 0) setEmpresa(res.data[0]);
      }).catch(err => console.error("Erro ao buscar empresa:", err))
    ]);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', coleta?: MobOS) => {
    setFormError('');
    setModalMode(mode);
    setIsModalOpen(true);
    if ((mode === 'edit' || mode === 'view') && coleta) {
      setCurrentId(coleta.id);
      setFormData({
        id: coleta.id,
        id_contato: coleta.id_contato,
        msgmob: coleta.msgmob || '',
        id_vendedor: coleta.id_vendedor || 0,
        pneus: coleta.pneus ? [...coleta.pneus] : [],
        numos: coleta.numos || '',
        cpfcnpj: coleta.cpfcnpj || '',
        nome: coleta.nome || '',
        endereco: coleta.endereco || '',
        cidade: coleta.cidade || '',
        uf: coleta.uf || '',
        fone: coleta.fone || '',
        veiculo: coleta.veiculo || '',
        formapagto: coleta.formapagto || '',
        vendedor_ocr: coleta.vendedor_ocr || '',
        servicocomgarantia: coleta.servicocomgarantia || '',
        tipoveiculo: coleta.tipoveiculo || '',
        somentesepar: coleta.somentesepar || '',
        podealterardesenho: coleta.podealterardesenho || '',
        status: coleta.status || ''
      });
    } else {
      setCurrentId(null);
      setFormData({
        id_contato: 0,
        msgmob: '',
        id_vendedor: 0,
        pneus: [],
        numos: '',
        cpfcnpj: '',
        nome: '',
        endereco: '',
        cidade: '',
        uf: '',
        fone: '',
        veiculo: '',
        formapagto: '',
        vendedor_ocr: '',
        servicocomgarantia: '',
        tipoveiculo: '',
        somentesepar: '',
        podealterardesenho: '',
        status: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const clienteId = parseInt(value);
    
    if (clienteId === 0) {
      setFormData((prev: any) => ({ 
        ...prev, 
        id_contato: 0,
        nome: '',
        cpfcnpj: '',
        fone: '',
        endereco: '',
        cidade: '',
        uf: ''
      }));
      return;
    }

    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setFormData((prev: any) => ({ 
        ...prev, 
        id_contato: clienteId,
        nome: cliente.nome,
        cpfcnpj: cliente.cpfcnpj || '',
        fone: cliente.foneprincipal || '',
        endereco: `${cliente.rua || ''}${cliente.numcasa ? ', ' + cliente.numcasa : ''}${cliente.bairro ? ' - ' + cliente.bairro : ''}`,
        cidade: cliente.cidade || '',
        uf: cliente.uf || '',
        id_vendedor: cliente.id_vendedor && cliente.id_vendedor !== 0 ? cliente.id_vendedor : prev.id_vendedor
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, id_contato: clienteId }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, id, value, type } = e.target as any;
    const fieldName = name || id;
    
    let finalValue: any = value;
    if (type === 'number') {
      finalValue = value === '' ? null : (value.includes('.') ? parseFloat(value) : parseInt(value));
    }
    
    setFormData((prev: any) => ({ ...prev, [fieldName]: finalValue }));
  };

  // Pneus Sub-Modal Logic
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
        id_recap: 0,
        valor: 0,
        piso: '',
        numserie: '',
        numfogo: '',
        dot: '',
        doriginal: '',
        qreforma: 0,
        uso: '',
        garantia: '',
        obs: '',
        medidanova: '',
        marcanova: '',
        desenhonovo: ''
      });
    }
    setIsPneuModalOpen(true);
  };

  const savePneu = () => {
    const newPneus = [...formData.pneus];
    if (editingPneuIndex !== null) {
      newPneus[editingPneuIndex] = tempPneu;
    } else {
      newPneus.push(tempPneu);
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
    setFormData((prev: any) => ({ ...prev, pneus: newPneus }));
  };

  const calculateTotal = () => {
    return formData.pneus.reduce((acc: number, p: any) => acc + parseFloat(p.valor || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando gravação da coleta...", formData);
    if (!formData.id_vendedor || formData.id_vendedor === 0) {
      setFormError('ERRO: Você precisa selecionar um Vendedor antes de gravar a coleta!');
      const body = document.querySelector('.modal-body.scrollable');
      if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        qpneu: formData.pneus.length,
        vtotal: calculateTotal()
      };
      
      console.log("Enviando payload para o servidor:", payload);

      if (modalMode === 'create') {
        const res = await api.post('/coletas/', payload);
        console.log("Coleta criada com sucesso:", res.data);
      } else {
        const res = await api.put(`/coletas/${currentId}`, payload);
        console.log("Coleta atualizada com sucesso:", res.data);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Erro detalhado na gravação:", error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? JSON.stringify(detail) : 'Erro ao processar Coleta de Pneus.');
      setFormError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateOS = (id: number) => {
    const coleta = coletas.find(c => c.id === id);
    if (!coleta) return;

    if (coleta.status !== 'Ok') {
      alert("Atenção: Esta coleta precisa estar com status 'Ok' (validada) antes de gerar a OS.");
      return;
    }

    if (!window.confirm(`Deseja converter a Coleta #${id} em uma Ordem de Serviço?\n\nVocê será levado para a tela de OS para completar os dados e salvar.`)) return;
    
    // Navega para a tela de OS passando os dados da coleta no state
    navigate('/os', { state: { fromColeta: true, coletaData: coleta } });
  };

  const handleValidate = () => {
    // Se já estiver como GOS, não faz nada
    if (formData.status === 'GOS') {
      alert("Esta coleta já possui status 'GOS' e não pode ser revalidada.");
      return;
    }

    const errors: string[] = [];
    
    if (!formData.id_contato || formData.id_contato === 0 || formData.id_contato === "0") {
      errors.push("Selecione um Cliente.");
    }
    
    if (!formData.id_vendedor || formData.id_vendedor === 0 || formData.id_vendedor === "0") {
      errors.push("Selecione um Vendedor.");
    }
    
    if (!formData.pneus || formData.pneus.length === 0) {
      errors.push("Adicione pelo menos um pneu à coleta.");
    } else {
      formData.pneus.forEach((p: any, idx: number) => {
        const itemNum = idx + 1;
        const hasMedida = (p.id_medida && p.id_medida > 0 && p.id_medida !== "0") || (p.medidanova && p.medidanova.trim() !== "");
        const hasMarca = (p.id_marca && p.id_marca > 0 && p.id_marca !== "0") || (p.marcanova && p.marcanova.trim() !== "");
        const hasDesenho = (p.id_desenho && p.id_desenho > 0 && p.id_desenho !== "0") || (p.desenhonovo && p.desenhonovo.trim() !== "");
        
        if (!hasMedida) errors.push(`Pneu #${itemNum}: Medida não informada.`);
        if (!hasMarca) errors.push(`Pneu #${itemNum}: Marca não informada.`);
        if (!hasDesenho) errors.push(`Pneu #${itemNum}: Desenho não informado.`);
      });
    }

    if (errors.length > 0) {
      setFormError(`PENDÊNCIAS:\n${errors.join('\n')}`);
      setFormData((prev: any) => ({ ...prev, status: "" })); // Deixa nulo/em branco se der erro
      const body = document.querySelector('.modal-body.scrollable');
      if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormError('');
      setFormData((prev: any) => ({ ...prev, status: "Ok" })); // Muda para Ok se tudo estiver certo
      alert("✅ Todos os dados obrigatórios foram preenchidos corretamente!\nStatus atualizado para 'Ok'. Não esqueça de Gravar a coleta.");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja realmente excluir esta Coleta? Os pneus vinculados também serão removidos.")) {
      try {
        await api.delete(`/coletas/${id}`);
        setSelectedId(null);
        fetchData();
      } catch (error) {
        console.error("Erro ao excluir coleta:", error);
      }
    }
  };



  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePrintList = () => {
    document.body.classList.add('printing-coleta-list-active');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-coleta-list-active');
    }, 500);
  };

  const handlePrintIndividual = () => {
    document.body.classList.add('printing-coleta-active');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-coleta-active');
    }, 500);
  };

  // Removido handleFileChange antigo (Mock) para evitar conflitos de processamento.

  const handleOCRFileClick = () => {
    if (ocrFileInputRef.current) {
      ocrFileInputRef.current.click();
    }
  };

  const handleOCRFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawResult = reader.result as string;
        const result = await compressImage(rawResult);
        
        try {
          sessionStorage.setItem('totalcap_ocr_session', JSON.stringify({
            preview: result,
            instructions: ocrInstructions,
            isOpen: true,
            timestamp: new Date().getTime()
          }));
        } catch (e) { console.warn("Erro ao salvar no storage"); }

        setOcrPreview(result);
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessOCR = async () => {
    if (!ocrPreview) {
      alert("Por favor, selecione uma imagem primeiro.");
      return;
    }

    try {
      setIsScanning(true);
      setFormError('');

      // Chamada real para o Backend (que integra com OpenAI)
      const response = await api.post('/ocr/analyze', { 
        image: ocrPreview,
        instrucoes: ocrInstructions.trim() ? ocrInstructions.trim() : undefined
      });
      const ocrData = response.data;

      // Função para limpeza de strings para comparação robusta
      const cleanString = (str: string) => 
        String(str || "").toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

      const processPneu = (itemData: any) => {
        const ocrMedidaClean = cleanString(itemData.medida);
        const ocrMarcaClean = cleanString(itemData.marca);
        const ocrDesenhoClean = cleanString(itemData.desenho);

        const matchedMedida = medidas.find(m => {
          const dbMedidaClean = cleanString(m.descricao);
          return dbMedidaClean && (dbMedidaClean.includes(ocrMedidaClean) || ocrMedidaClean.includes(dbMedidaClean));
        })?.id || 0;

        const matchedMarca = marcas.find(m => {
          const dbMarcaClean = cleanString(m.descricao);
          return dbMarcaClean && (dbMarcaClean.includes(ocrMarcaClean) || ocrMarcaClean.includes(dbMarcaClean));
        })?.id || 0;

        const matchedDesenho = desenhos.find(d => {
          const dbDesenhoClean = cleanString(d.descricao);
          return dbDesenhoClean && (dbDesenhoClean.includes(ocrDesenhoClean) || ocrDesenhoClean.includes(dbDesenhoClean));
        })?.id || 0;

        return {
          id_medida: matchedMedida,
          id_marca: matchedMarca,
          id_desenho: matchedDesenho,
          id_recap: tiposRecap[0]?.id || 0,
          valor: 0,
          piso: itemData.piso || '',
          numserie: itemData.numserie || '',
          numfogo: itemData.numfogo || '',
          dot: itemData.dot_data || itemData.dot || '',
          medidanova: itemData.medida || '',
          marcanova: itemData.marca || '',
          desenhonovo: itemData.desenho || '',
          obs: (itemData.raw_text || '') + (ocrData.provedor ? ` (IA: ${ocrData.provedor})` : '')
        };
      };

      const novosPneus: any[] = [];
      if (ocrData.itens && Array.isArray(ocrData.itens) && ocrData.itens.length > 0) {
        for (const item of ocrData.itens) {
            novosPneus.push(processPneu(item));
        }
      } else {
        novosPneus.push(processPneu(ocrData));
      }

      // Extrair cabecalho e rodape para uso no preenchimento do formulário
      const cabecalho = ocrData.cabecalho || {};
      const rodape = ocrData.rodape || {};
      const provedorNome = ocrData.provedor === 'gemini' ? 'Google Gemini' : 'OpenAI GPT-4o-mini';

      // LÓGICA DE BUSCA DE CLIENTE POR CPF/CNPJ (Solicitado pelo Usuário)
      let matchedCliente = null;
      const rawCpfCnpjOCR = String(cabecalho.cpfcnpj || "").replace(/\D/g, "");
      
      if (rawCpfCnpjOCR) {
        matchedCliente = clientes.find(c => {
          const dbCpfCnpj = String(c.cpfcnpj || "").replace(/\D/g, "");
          return dbCpfCnpj === rawCpfCnpjOCR;
        });
      }

      if (isModalOpen) {
        setFormData((prev: any) => ({
          ...prev,
          pneus: [...prev.pneus, ...novosPneus]
        }));
      } else {
        setFormData({
          id_contato: matchedCliente ? matchedCliente.id : (formData.id_contato || (clientes.length > 0 ? clientes[0].id : 0)),
          id_vendedor: (matchedCliente && matchedCliente.id_vendedor && matchedCliente.id_vendedor !== 0) 
            ? matchedCliente.id_vendedor 
            : (formData.id_vendedor || (vendedores.length > 0 ? vendedores[0].id : 0)),
          msgmob: matchedCliente ? `Coleta vinculada ao cliente: ${matchedCliente.nome}` : 'Coleta gerada via Leitura OCR',
          pneus: novosPneus,
          numos: cabecalho.numos || '',
          cpfcnpj: matchedCliente ? (matchedCliente.cpfcnpj || '') : (cabecalho.cpfcnpj || ''),
          nome: matchedCliente ? matchedCliente.nome : (cabecalho.nome || ''),
          endereco: matchedCliente 
            ? `${matchedCliente.rua || ''}${matchedCliente.numcasa ? ', ' + matchedCliente.numcasa : ''}${matchedCliente.bairro ? ' - ' + matchedCliente.bairro : ''}`
            : (cabecalho.endereco || ''),
          cidade: matchedCliente ? (matchedCliente.cidade || '') : (cabecalho.cidade || ''),
          uf: matchedCliente ? (matchedCliente.uf || '') : (cabecalho.uf || ''),
          fone: matchedCliente ? (matchedCliente.foneprincipal || '') : (cabecalho.fone || ''),
          veiculo: cabecalho.veiculo || '',
          formapagto: cabecalho.formapagto || '',
          vendedor_ocr: cabecalho.vendedor_ocr || '',
          servicocomgarantia: cabecalho.servicocomgarantia || '',
          tipoveiculo: cabecalho.tipoveiculo || '',
          somentesepar: cabecalho.somentesepar || '',
          podealterardesenho: cabecalho.podealterardesenho || '',
          status: ''
        });
        setModalMode('create');
        // Mantemos o modal OCR aberto para o usuário ver o resultado no Memo
      }
      
      let formattedResult = `IA (${provedorNome}) - ${new Date().toLocaleString()}\n` +
        `-----------------------------------\n` +
        `[CABEÇALHO]\n` +
        `OS: ${cabecalho.numos || '???'}\n` +
        `Cliente: ${cabecalho.nome || '???'}\n` +
        `CPF/CNPJ: ${cabecalho.cpfcnpj || '???'}\n` +
        `Cidade/UF: ${cabecalho.cidade || '???'}/${cabecalho.uf || '???'}\n` +
        `Placa (Veículo): ${cabecalho.veiculo || '???'}\n` +
        `Pagto: ${cabecalho.formapagto || '???'}\n` +
        `Vendedor OCR: ${cabecalho.vendedor_ocr || '???'}\n` +
        `Tipo Veículo: ${cabecalho.tipoveiculo || '???'}\n` +
        `Garantia: ${cabecalho.servicocomgarantia || '???'}\n` +
        `-----------------------------------\n`;

      if (ocrData.itens && Array.isArray(ocrData.itens) && ocrData.itens.length > 0) {
          ocrData.itens.forEach((item: any, idx: number) => {
              formattedResult += `[PNEU ${idx + 1}]\n` +
              `Medida: ${item.medida || '???'}\n` +
              `Marca: ${item.marca || '???'}\n` +
              `Série: ${item.numserie || '???'}\n` +
              `Fogo: ${item.numfogo || '???'}\n` +
              `-----------------------------------\n`;
          });
      } else {
         formattedResult += `[PNEU PRINCIPAL]\n` +
        `Medida: ${ocrData.medida || '???'}\n` +
        `Marca: ${ocrData.marca || '???'}\n` +
        `Série: ${ocrData.numserie || '???'}\n` +
        `Fogo: ${ocrData.numfogo || '???'}\n` +
        `-----------------------------------\n`;
      }

      formattedResult += `[RODAPÉ]\n` +
        `Vendedor (Assinatura): ${rodape.vendedor_assinatura || '???'}\n` +
        `Obs Finais: ${rodape.obs_final || '???'}\n` +
        `-----------------------------------\n` +
        `Status: ${novosPneus.length} pneu(s) adicionado(s) ao formulário.`;
      
      setOcrResultText(formattedResult);
      // Limpamos a sessão persistente após sucesso
      localStorage.removeItem('totalcap_ocr_session');
    } catch (error: any) {
      console.error("Erro no processamento OCR real:", error);
      const detail = error.response?.data?.detail || error.message;
      setOcrResultText(`ERRO NA IA:\n${detail}\n\nCertifique-se de que a API Key está configurada no .env`);
      setFormError("Erro ao processar imagem via OpenAI.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCameraFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawResult = reader.result as string;
        const result = await compressImage(rawResult);
        
        // Salvamento instantâneo
        try {
          sessionStorage.setItem('totalcap_ocr_session', JSON.stringify({
            preview: result,
            instructions: ocrInstructions,
            isOpen: true,
            timestamp: new Date().getTime()
          }));
        } catch (e) { console.warn("Erro ao salvar no storage"); }

        setOcrPreview(result);
        if (!isOCRModalOpen) setIsOCRModalOpen(true);
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedColeta = coletas.find(c => c.id === selectedId);

  return (
    <div className="coleta-container fade-in">
      {/* Cabeçalho de Impressão Padrão */}
      <div className="report-print-header only-print">
        <div className="print-header-top">
          <div className="print-logo">
            <img src={LogoDbnet} alt="Logo" />
          </div>
          <div className="print-main-row">
            <div className="print-company-name">{empresa?.razaosocial || 'TOTALCAP GESTÃO DE PNEUS'}</div>
            <div className="print-date"><strong>Data Impressão:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
        <div className="print-header-bottom">
          <div className="print-report-title">RELATÓRIO DE COLETA DE PNEUS</div>
          <div className="print-meta-info">
            <span><strong>Período:</strong> {startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} à {endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'}</span>
          </div>
        </div>
      </div>

      {isScanning && (
        <div className="scanning-overlay">
          <div className="scanning-card">
            <Loader2 className="spinning text-primary" size={48} />
            <h3>Processando OCR via IA...</h3>
            <p>Aguarde enquanto analisamos a imagem do pneu.</p>
          </div>
        </div>
      )}
      <div className="page-header">
        <div className="header-title-container">
          <div className="header-title">
            <ClipboardList size={32} className="text-primary" />
            <h1>Coleta de Pneus</h1>
          </div>
          <p className="page-subtitle">Gestao de coleta externa de pneus</p>
        </div>
        <div className="header-actions no-print">
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            capture="environment"
            onChange={handleCameraFileChange} 
          />
          <button className="btn-accent" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} onClick={() => setIsOCRModalOpen(true)} title="Leitura OCR de Imagem">
            <Search size={20} /> LeituraOCR
          </button>
          <button className="btn-print" onClick={handlePrintList} title="Imprimir Lista de Coletas">
            <Printer size={20} /> Imprimir Lista
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} /> Nova Coleta
          </button>
        </div>
      </div>

      <div className="glass-panel table-container overflow-hidden" style={{ margin: '0 2rem 2rem 2rem' }}>
        <div className="table-toolbar no-print" style={{ padding: '1.25rem 2rem' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por ID, cliente, vendedor ou OS..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="date-filters">
            <div className="date-input-group">
              <Calendar size={16} className="date-icon" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Data Inicial"
              />
            </div>
            <span className="date-separator">até</span>
            <div className="date-input-group">
              <Calendar size={16} className="date-icon" />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Data Final"
              />
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="error-banner" style={{ margin: '0 2rem 1rem 2rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span>Erro ao carregar dados: {fetchError}. Verifique se o servidor está rodando.</span>
          </div>
        )}

        {loading ? (
          <div className="loading-container p-12 text-center text-slate-400">
            <Loader2 className="spinning mb-2" size={32} />
            <p>Carregando coletas...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table print-list-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>OS Gerada</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Volume</th>
                  <th>Vrt. Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }} className="no-print">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredColetas.length === 0 ? (
                  <tr><td colSpan={9} className="empty-state text-center p-8 text-slate-400">Nenhum registro encontrado.</td></tr>
                ) : (
                  filteredColetas.map(coleta => (
                    <tr 
                      key={coleta.id} 
                      className={selectedId === coleta.id ? 'row-selected' : ''} 
                      onClick={() => setSelectedId(selectedId === coleta.id ? null : coleta.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><span className="os-number">#{coleta.id}</span></td>
                      <td>{coleta.numos ? <span className="os-number os-generated">#{coleta.numos}</span> : '---'}</td>
                      <td>{coleta.dataos ? new Date(coleta.dataos).toLocaleDateString('pt-BR') : '---'}</td>
                      <td>{coleta.contato?.nome || 'Cliente não encontrado'}</td>
                      <td>{coleta.vendedor?.nome || '---'}</td>
                      <td><span className="badge-info highlight">{(coleta.pneus?.length || 0)} pneu(s)</span></td>
                      <td className="valor-cell-readonly">R$ {parseFloat((coleta.vtotal || 0).toString()).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge-item status-${
                          coleta.status === 'Ok' ? 'pronto' : 
                          coleta.status === 'GOS' ? 'accent' : 'aguardando'
                        }`}>
                          {coleta.status || 'Pendente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} className="no-print">
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            className={`icon-btn warning ${coleta.status === 'GOS' ? 'disabled' : ''}`} 
                            onClick={(e) => { e.stopPropagation(); handleGenerateOS(coleta.id); }} 
                            title="Gerar Ordem de Serviço" 
                            disabled={coleta.status === 'GOS'}
                            style={{ minWidth: '95px', background: '#f59e0b' }}
                          >
                            <FilePlus size={18} />
                            <span>Gera OS</span>
                          </button>
                          <button 
                            className="icon-btn success" 
                            onClick={(e) => { e.stopPropagation(); openModal('view', coleta); }} 
                            title="Visualizar Detalhes"
                            style={{ background: '#10b981' }}
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            className={`icon-btn edit ${coleta.status === 'GOS' ? 'disabled' : ''}`}
                            onClick={(e) => { e.stopPropagation(); openModal('edit', coleta); }} 
                            title="Editar Coleta"
                            disabled={coleta.status === 'GOS'}
                            style={{ background: '#3b82f6' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className={`icon-btn delete ${coleta.status === 'GOS' ? 'disabled' : ''}`}
                            onClick={(e) => { e.stopPropagation(); handleDelete(coleta.id); }} 
                            title="Excluir Coleta"
                            disabled={coleta.status === 'GOS'}
                            style={{ background: '#ef4444' }}
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
        )}
      </div>

      {/* BANNER DE RECUPERAÇÃO OCR (Caso o modal feche sozinho no mobile) */}
      {!isOCRModalOpen && ocrPreview && (
        <div className="ocr-recovery-banner" style={{ 
          margin: '0 2rem 1rem 2rem', 
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          animation: 'slideDown 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)' }}>
              <img src={ocrPreview} alt="Recuperar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <strong style={{ display: 'block' }}>Captura de OCR Detectada</strong>
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Você tem uma leitura pendente que não foi concluída.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" style={{ background: 'white', color: '#059669', border: 'none' }} onClick={() => setIsOCRModalOpen(true)}>Continuar Leitura</button>
            <button className="btn-icon" style={{ color: 'white', opacity: 0.8 }} onClick={clearOCRSession} title="Descartar"><X size={18} /></button>
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <div className="coleta-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="premium-modal-content full-screen" onClick={e => e.stopPropagation()}>
            <div className="premium-modal-header">
              <h2>{modalMode === 'create' ? 'Nova Coleta de Pneus' : (modalMode === 'view' ? 'Visualizar Coleta de Pneus' : 'Editar Coleta de Pneus')}</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {modalMode !== 'create' && (
                  <button 
                    type="button" 
                    className="btn-print-modal" 
                    onClick={handlePrintIndividual}
                    title="Imprimir Coleta"
                  >
                    <Printer size={18} />
                    Imprimir Coleta
                  </button>
                )}
                <button type="button" className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="premium-master-panel">
                  <div className="premium-section-title"><User size={18} /> Dados do Cliente</div>
                  <div className="grid-4">
                    <div className="form-group span-2">
                      <label>Cliente</label>
                      <select className="form-input" id="id_contato" name="id_contato" value={formData.id_contato} onChange={handleClienteChange} disabled={modalMode === 'view'}>
                        <option value={0}>Selecione...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>CPF/CNPJ</label>
                      <input className="form-input" type="text" id="cpfcnpj" name="cpfcnpj" value={formData.cpfcnpj} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label>Fone</label>
                      <input className="form-input" type="text" id="fone" name="fone" value={formData.fone} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group span-3">
                      <label>Endereço</label>
                      <input className="form-input" type="text" id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label>Cidade</label>
                      <input className="form-input" type="text" id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label>UF</label>
                      <input className="form-input" type="text" id="uf" name="uf" value={formData.uf} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                  </div>
                </div>

                <div className="premium-master-panel">
                  <div className="premium-section-title"><DollarSign size={18} /> Dados da OS</div>
                  <div className="grid-4">
                    <div className="form-group">
                      <label>Nº OS</label>
                      <input className="form-input" type="number" id="numos" name="numos" value={formData.numos} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label>Vendedor</label>
                      <select className="form-input" id="id_vendedor" name="id_vendedor" value={formData.id_vendedor} onChange={handleChange} disabled={modalMode === 'view'}>
                        <option value={0}>Selecione...</option>
                        {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Forma Pagto</label>
                      <input className="form-input" type="text" id="formapagto" name="formapagto" value={formData.formapagto} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label>Veículo</label>
                      <input className="form-input" type="text" id="veiculo" name="veiculo" value={formData.veiculo} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label>Tipo Veículo</label>
                      <input className="form-input" type="text" id="tipoveiculo" name="tipoveiculo" value={formData.tipoveiculo} onChange={handleChange} disabled={modalMode === 'view'} />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <input className="form-input" type="text" id="status" name="status" value={formData.status} onChange={handleChange} disabled={modalMode === 'edit' || modalMode === 'view'} />
                    </div>
                  </div>
                </div>

                <div className="premium-master-panel">
                  <div className="premium-section-title"><ClipboardList size={18} /> Observações</div>
                  <textarea className="form-input" id="msgmob" name="msgmob" value={formData.msgmob} onChange={handleChange} rows={3} disabled={modalMode === 'view'} />
                </div>

                <div className="premium-master-panel">
                  <div className="premium-section-title"><Package size={18} /> Pneus ({formData.pneus?.length || 0})</div>
                  <div className="pneus-grid-container">
                    <table className="pneus-table">
                      <thead>
                        <tr>
                          <th style={{ width: '180px' }}>Medida</th>
                          <th style={{ width: '150px' }}>Marca</th>
                          <th>Desenho</th>
                          <th>Recap</th>
                          <th style={{ width: '100px' }}>Valor</th>
                          <th style={{ width: '120px' }}>Série/Fogo</th>
                          <th style={{ width: '180px' }}>Medida OCR</th>
                          <th>Desenho OCR</th>
                          <th style={{ width: '80px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.pneus?.length === 0 ? (
                          <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Nenhum pneu adicionado.</td></tr>
                        ) : (
                          formData.pneus.map((p: any, idx: number) => (
                            <tr key={idx}>
                              <td>{medidas.find(m => m.id === parseInt(p.id_medida))?.descricao || '---'}</td>
                              <td>{marcas.find(m => m.id === parseInt(p.id_marca))?.descricao || p.marcanova || '---'}</td>
                              <td>{desenhos.find(d => d.id === parseInt(p.id_desenho))?.descricao || '---'}</td>
                              <td>{tiposRecap.find(t => t.id === parseInt(p.id_recap))?.descricao || '---'}</td>
                              <td>R$ {parseFloat(p.valor || 0).toFixed(2)}</td>
                              <td>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  S: {p.numserie || '-'} / F: {p.numfogo || '-'}
                                </div>
                              </td>
                              <td style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>{p.medidanova || '---'}</td>
                              <td style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>{p.desenhonovo || '---'}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button type="button" className="icon-btn edit" onClick={() => openPneuModal(idx)}><Edit2 size={16} /></button>
                                  <button type="button" className="icon-btn delete" onClick={() => removePneu(idx)}><Trash2 size={16} /></button>
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
                      <div className="summary-item highlight">
                        <span>Total:</span>
                        <span className="total-value">R$ {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="premium-modal-footer">
                {modalMode !== 'view' && (
                  <button type="button" className="btn-accent" onClick={handleValidate} style={{ background: '#10b981', color: 'white', marginRight: 'auto' }}>
                    <Shield size={18} /> Validar Dados
                  </button>
                )}
                
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                </button>

                {modalMode !== 'view' && (
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      {isSubmitting ? <Loader2 className="spinning" size={18} /> : <Save size={18} />}
                      <span>{modalMode === 'create' ? 'Salvar Coleta' : 'Salvar Alterações'}</span>
                    </div>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {isPneuModalOpen && (
        <div className="coleta-modal-overlay" onClick={() => setIsPneuModalOpen(false)}>
          <div className="pneu-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="pneu-modal-header">
              <h3>{editingPneuIndex !== null ? 'Editar Pneu' : 'Adicionar Pneu'}</h3>
              <button className="close-btn" onClick={() => setIsPneuModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="pneu-modal-scroll">
              <div className="form-group">
                <label>Medida</label>
                <select className="form-input" value={tempPneu.id_medida} onChange={e => handleTempPneuChange('id_medida', e.target.value)}>
                  <option value={0}>Selecione...</option>
                  {medidas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Marca</label>
                <select className="form-input" value={tempPneu.id_marca} onChange={e => handleTempPneuChange('id_marca', e.target.value)}>
                  <option value={0}>Selecione...</option>
                  {marcas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Desenho</label>
                <select className="form-input" value={tempPneu.id_desenho} onChange={e => handleTempPneuChange('id_desenho', e.target.value)}>
                  <option value={0}>Selecione...</option>
                  {desenhos.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Recapagem</label>
                <select className="form-input" value={tempPneu.id_recap} onChange={e => handleTempPneuChange('id_recap', e.target.value)}>
                  <option value={0}>Selecione...</option>
                  {tiposRecap.map(t => <option key={t.id} value={t.id}>{t.descricao}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input className="form-input" type="number" step="0.01" value={tempPneu.valor} onChange={e => handleTempPneuChange('valor', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nº Série</label>
                <input className="form-input" type="text" value={tempPneu.numserie} onChange={e => handleTempPneuChange('numserie', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nº Fogo</label>
                <input className="form-input" type="text" value={tempPneu.numfogo} onChange={e => handleTempPneuChange('numfogo', e.target.value)} />
              </div>
              <div className="form-group">
                <label>DOT</label>
                <input className="form-input" type="text" value={tempPneu.dot} onChange={e => handleTempPneuChange('dot', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Medida OCR (Capturada)</label>
                <input className="form-input" type="text" value={tempPneu.medidanova} onChange={e => handleTempPneuChange('medidanova', e.target.value)} placeholder="Valor detectado pela IA" />
              </div>
              <div className="form-group">
                <label>Desenho OCR (Capturado)</label>
                <input className="form-input" type="text" value={tempPneu.desenhonovo} onChange={e => handleTempPneuChange('desenhonovo', e.target.value)} placeholder="Valor detectado pela IA" />
              </div>
            </div>
            <div className="modal-footer-coleta">
              <button type="button" className="btn-secondary" onClick={() => setIsPneuModalOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={savePneu}>Salvar Pneu</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OCR */}
      {isOCRModalOpen && (
        <div className="coleta-modal-overlay" onClick={() => setIsOCRModalOpen(false)}>
          <div className="ocr-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ocr-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={20} /> Leitura Inteligente (OCR)
                </h3>
                <button className="close-btn" style={{ color: 'white' }} onClick={() => setIsOCRModalOpen(false)}><X size={20} /></button>
              </div>
            </div>
            <div className="ocr-body">
              <p className="ocr-instruction">Analise as laterais do pneu para identificar medida, marca e série via IA.</p>
              
              <div className="ocr-upload-zone" onClick={handleOCRFileClick}>
                {ocrPreview ? (
                  <img src={ocrPreview} alt="Preview" className="ocr-image-preview" />
                ) : (
                  <div className="ocr-placeholder">
                    <div className="upload-icon-container">
                      <Plus size={32} className="text-primary" />
                    </div>
                    <span>Toque para tirar foto ou carregar</span>
                  </div>
                )}
              </div>

              <div className="ocr-top-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-camera-action" onClick={() => fileInputRef.current?.click()} style={{ flex: 1 }}>
                    <Camera size={20} /> Câmera
                  </button>
                  <button className="btn-camera-action" onClick={handleOCRFileClick} style={{ flex: 1 }}>
                    <Plus size={20} /> Selecionar Foto
                  </button>
              </div>

              <div className="ocr-middle-actions">
                <input 
                  type="text" 
                  placeholder="Instruções extras p/ IA (ex: focar apenas na marca)"
                  className="ocr-instruction-input"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  value={ocrInstructions}
                  onChange={(e) => setOcrInstructions(e.target.value)}
                />
              </div>

              <button 
                className="btn-send-ia" 
                onClick={handleProcessOCR} 
                disabled={!ocrPreview || isScanning}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  {isScanning ? <Loader2 className="spinning" size={20} /> : <Save size={20} />} 
                  <span>{isScanning ? 'Enviando p/ IA...' : 'Envia p/ IA'}</span>
                </div>
              </button>

              {ocrResultText && (
                <div className="ocr-result-section">
                  <label className="memo-label">RESULTADO DETALHADO (MEMO)</label>
                  <textarea 
                    className="ocr-memo-field" 
                    readOnly 
                    value={ocrResultText}
                    style={{ minHeight: '120px' }}
                  />
                </div>
              )}
            </div>
            
            <div className="ocr-footer">
              <div className="ocr-action-buttons">
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsOCRModalOpen(false)}>Fechar</button>
                {ocrPreview && <button className="btn-accent" style={{ flex: 1, backgroundColor: '#ef4444' }} onClick={clearOCRSession}>Descartar</button>}
                {ocrResultText && (
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                    setIsOCRModalOpen(false);
                    setIsModalOpen(true);
                  }}>
                    Gerar MobOS
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input oculto para carregar arquivo (não câmera direta) */}
      <input 
        type="file" 
        ref={ocrFileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handleOCRFileChange} 
      />
      {/* TEMPLATE DE IMPRESSÃO INDIVIDUAL - Só aparece no papel */}
      <div className="print-template only-print">
        <div className="print-header">
          <div className="print-logo-section">
            <img src={LogoDbnet} alt="Logo" style={{ height: '60px' }} />
            <div>
              <h2>{empresa?.razaosocial || 'TOTALCAP GESTÃO DE PNEUS'}</h2>
              <p>Comprovante de Coleta de Pneus</p>
            </div>
          </div>
          <div className="print-id-section">
            <span className="print-id-label">COLETA Nº</span>
            <span className="print-id-value">#{formData.id || '---'}</span>
          </div>
        </div>

        <div className="print-info-grid">
          <div className="info-block">
            <span className="info-label">Cliente</span>
            <span className="info-value">{formData.nome || clientes.find(c => c.id === parseInt(formData.id_contato))?.nome || '---'}</span>
          </div>
          <div className="info-block">
            <span className="info-label">CPF/CNPJ</span>
            <span className="info-value">{formData.cpfcnpj || '---'}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Data Coleta</span>
            <span className="info-value">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="info-block" style={{ gridColumn: 'span 2' }}>
            <span className="info-label">Endereço</span>
            <span className="info-value">{formData.endereco || '---'}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Cidade/UF</span>
            <span className="info-value">{formData.cidade || '---'} / {formData.uf || '--'}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Vendedor</span>
            <span className="info-value">{vendedores.find(v => v.id === parseInt(formData.id_vendedor))?.nome || '---'}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Nº OS Relacionada</span>
            <span className="info-value">#{formData.numos || '---'}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Status</span>
            <span className="info-value">{formData.status || 'Pendente'}</span>
          </div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>Medida</th>
              <th>Marca</th>
              <th>Desenho</th>
              <th>Série</th>
              <th>Fogo</th>
              <th>Recap</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {(formData.pneus || []).map((p: any, idx: number) => (
              <tr key={idx}>
                <td>{medidas.find(m => String(m.id) === String(p.id_medida))?.descricao || p.medidanova || '---'}</td>
                <td>{marcas.find(m => String(m.id) === String(p.id_marca))?.descricao || p.marcanova || '---'}</td>
                <td>{desenhos.find(d => String(d.id) === String(p.id_desenho))?.descricao || p.desenhonovo || '---'}</td>
                <td>{p.numserie || '---'}</td>
                <td>{p.numfogo || '---'}</td>
                <td>{tiposRecap.find(tr => String(tr.id) === String(p.id_recap))?.descricao || '---'}</td>
                <td style={{ textAlign: 'right' }}>R$ {parseFloat(p.valor || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold' }}>VALOR TOTAL:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>R$ {calculateTotal().toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {formData.msgmob && (
          <div style={{ marginBottom: '40px' }}>
            <span className="info-label">Observações</span>
            <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px', fontSize: '0.9rem' }}>
              {formData.msgmob}
            </div>
          </div>
        )}

        <div className="print-signatures">
          <div className="signature-box">
            <div className="signature-line"></div>
            <span>Assinatura do Cliente</span>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <span>Assinatura do Conferente</span>
          </div>
        </div>

        <div className="print-footer-info">
          Documento gerado pelo Sistema Totalcap em {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* RELATÓRIO DE LISTA - Layout de Qualidade */}
      <div className="report-list-container only-print">
        <div className="report-list-header">
          <div className="report-header-main">
            <div className="report-logo-box">
              <img src={LogoDbnet} alt="Logo" />
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
            <h1>RELATÓRIO DE COLETA DE PNEUS</h1>
            <div className="report-filter-info">
              {searchTerm ? `Filtro: "${searchTerm}"` : 'Filtro: Todos os registros'}
            </div>
          </div>
        </div>

        <table className="report-modern-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th style={{ width: '120px' }}>Número OS</th>
              <th style={{ width: '120px' }}>Data</th>
              <th>Cliente</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Valor Total</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredColetas.map((coleta: any) => (
              <tr key={coleta.id}>
                <td className="cell-id">#{coleta.id}</td>
                <td className="cell-os">{coleta.numos ? `#${coleta.numos}` : '---'}</td>
                <td>{coleta.dataos ? new Date(coleta.dataos).toLocaleDateString('pt-BR') : '---'}</td>
                <td className="cell-client">{coleta.contato?.nome || '---'}</td>
                <td className="cell-value">R$ {parseFloat(coleta.vtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="cell-status"><span className={`status-pill ${String(coleta.status || '').toLowerCase()}`}>{coleta.status || 'PENDENTE'}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="footer-label">VALOR TOTAL ACUMULADO:</td>
              <td className="footer-value">
                R$ {filteredColetas.reduce((acc: number, curr: any) => acc + (parseFloat(curr.vtotal) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="footer-count">{filteredColetas.length} registro(s)</td>
            </tr>
          </tfoot>
        </table>
        
        <div className="report-list-footer">
          <p>Documento gerado eletronicamente pelo Sistema Totalcap</p>
          <p>Página 1 de 1</p>
        </div>
      </div>

    </div>

  );
}
