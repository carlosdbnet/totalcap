import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Trash2, Edit2, X, DollarSign, Shield, Info, ClipboardList, Printer, Camera, Loader2, AlertCircle, User } from 'lucide-react';
import api from '../lib/api';
import './ColetaPneus.css';

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
  sincronizado: boolean;
  pneus: MobPneu[];
  contato?: { nome: string };
  vendedor?: { nome: string };
  numeroos: string;
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
  
  // Lookups
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [desenhos, setDesenhos] = useState<any[]>([]);
  const [tiposRecap, setTiposRecap] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrResultText, setOcrResultText] = useState('');
  const [ocrInstructions, setOcrInstructions] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  // Form State (MobOS)
  const [formData, setFormData] = useState<any>({
    id_contato: 0,
    msgmob: '',
    id_vendedor: 0,
    pneus: [],
    numeroos: '',
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
    podealterardesenho: ''
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
    fetchData();
    fetchLookups();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredColetas(coletas);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredColetas(coletas.filter(c => 
        String(c.id).includes(lowerSearch) || 
        (c.contato?.nome || '').toLowerCase().includes(lowerSearch) ||
        (c.vendedor?.nome || '').toLowerCase().includes(lowerSearch) ||
        (c.numeroos ? String(c.numeroos) : '').includes(lowerSearch)
      ));
    }
  }, [searchTerm, coletas, clientes]);

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
    ]);
  };

  const openModal = (mode: 'create' | 'edit', coleta?: MobOS) => {
    setFormError('');
    setModalMode(mode);
    if (mode === 'edit' && coleta) {
      setCurrentId(coleta.id);
      setFormData({
        id_contato: coleta.id_contato,
        msgmob: coleta.msgmob || '',
        id_vendedor: coleta.id_vendedor || 0,
        pneus: coleta.pneus ? [...coleta.pneus] : [],
        numeroos: coleta.numeroos || '',
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
        podealterardesenho: coleta.podealterardesenho || ''
      });
    } else {
      setCurrentId(null);
      setFormData({
        id_contato: 0,
        msgmob: '',
        id_vendedor: 0,
        pneus: [],
        numeroos: '',
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
        podealterardesenho: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
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

  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja realmente excluir esta Coleta? Os pneus vinculados também serão removidos.")) {
      try {
        await api.delete(`/coletas/${id}`);
        fetchData();
      } catch (error) {
        console.error("Erro ao excluir coleta:", error);
      }
    }
  };

  const handlePrint = () => {
    if (!selectedId) {
      alert("Por favor, selecione uma coleta na tabela clicando sobre ela.");
      return;
    }
    window.print();
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setFormError('');

      // Simulação de processamento de IA (OCR)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Mock de resposta da IA (JSON)
      const mockResult = {
        id_contato: formData.id_contato || clientes[0]?.id_contato,
        pneus: [
          {
            id_medida: medidas[0]?.id || 0,
            id_marca: marcas[0]?.id || 0,
            id_desenho: desenhos[0]?.id || 0,
            id_recap: tiposRecap[0]?.id || 0,
            valor: 450.00,
            piso: '7MM',
            numserie: 'DOT1234',
            numfogo: 'OS789',
            obs: 'Detectado via OCR MobVenda'
          }
        ]
      };

      // Se o modal estiver aberto, mescla os dados; senão, abre uma nova coleta com os dados
      if (isModalOpen) {
        setFormData((prev: any) => ({
          ...prev,
          pneus: [...prev.pneus, ...mockResult.pneus]
        }));
      } else {
        setFormData({
          id_contato: mockResult.id_contato,
          id_vendedor: formData.id_vendedor,
          msgmob: 'Coleta gerada via Scanner Inteligente',
          pneus: mockResult.pneus
        });
        setModalMode('create');
        setIsModalOpen(true);
      }

      alert("Leitura OCR concluída com sucesso! Verifique os dados no formulário.");
    } catch (error) {
      console.error("Erro no processamento OCR:", error);
      setFormError("Erro ao processar imagem via IA.");
    } finally {
      setIsScanning(false);
      if (event.target) event.target.value = ''; // Limpa o input
    }
  };

  const handleOCRFileClick = () => {
    if (ocrFileInputRef.current) {
      ocrFileInputRef.current.click();
    }
  };

  const handleOCRFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOcrPreview(reader.result as string);
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
          medidanova: matchedMedida === 0 ? itemData.medida : '',
          marcanova: matchedMarca === 0 ? itemData.marca : '',
          desenhonovo: matchedDesenho === 0 ? itemData.desenho : '',
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

      if (isModalOpen) {
        setFormData((prev: any) => ({
          ...prev,
          pneus: [...prev.pneus, ...novosPneus]
        }));
      } else {
        setFormData({
          id_contato: formData.id_contato || (clientes.length > 0 ? clientes[0].id_contato : 0),
          id_vendedor: formData.id_vendedor || (vendedores.length > 0 ? vendedores[0].id : 0),
          msgmob: 'Coleta gerada via Leitura OCR',
          pneus: novosPneus,
          numeroos: cabecalho.numeroos || '',
          cpfcnpj: cabecalho.cpfcnpj || '',
          nome: cabecalho.nome || '',
          endereco: cabecalho.endereco || '',
          cidade: cabecalho.cidade || '',
          uf: cabecalho.uf || '',
          fone: cabecalho.fone || '',
          veiculo: cabecalho.veiculo || '',
          formapagto: cabecalho.formapagto || '',
          vendedor_ocr: cabecalho.vendedor_ocr || '',
          servicocomgarantia: cabecalho.servicocomgarantia || '',
          tipoveiculo: cabecalho.tipoveiculo || '',
          somentesepar: cabecalho.somentesepar || '',
          podealterardesenho: cabecalho.podealterardesenho || ''
        });
        setModalMode('create');
        setIsModalOpen(true);
      }
      
      let formattedResult = `IA (${provedorNome}) - ${new Date().toLocaleString()}\n` +
        `-----------------------------------\n` +
        `[CABEÇALHO]\n` +
        `OS: ${cabecalho.numeroos || '???'}\n` +
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
      reader.onloadend = () => {
        setOcrPreview(reader.result as string);
         if (!isOCRModalOpen) setIsOCRModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedColeta = coletas.find(c => c.id === selectedId);

  return (
    <div className="coleta-container fade-in">
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
          <p className="page-subtitle">Gerencie as coletas externas integradas com o sistema MobVenda</p>
        </div>
        <div className="header-actions">
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
          <button className="btn-secondary" onClick={handlePrint} disabled={!selectedId} style={{ opacity: selectedId ? 1 : 0.6 }}>
            <Printer size={20} /> Imprimir Selecionada
          </button>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={20} /> Nova Coleta
          </button>
        </div>
      </div>

      <div className="data-toolbar glass-panel">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por ID ou nome do cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={fetchData} title="Recarregar dados">
          <Loader2 className={loading ? "spinning" : ""} size={18} /> Atualizar Lista
        </button>
      </div>

      {fetchError && (
        <div className="error-banner" style={{ margin: '0 2rem 1rem 2rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>Erro ao carregar dados: {fetchError}. Verifique se o servidor está rodando.</span>
        </div>
      )}

      <div className="data-grid-container glass-panel">
        {loading ? (
          <div className="loading-state">Carregando coletas...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Qtd. Pneus</th>
                  <th>Valor Total</th>
                  <th>Sincronizado</th>
                  <th className="th-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredColetas.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">Nenhuma coleta encontrada.</td></tr>
                ) : (
                  filteredColetas.map(coleta => (
                    <tr 
                      key={coleta.id} 
                      className={selectedId === coleta.id ? 'row-selected' : ''} 
                      onClick={() => setSelectedId(selectedId === coleta.id ? null : coleta.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><span className="os-number">#{coleta.id}</span></td>
                      <td>{coleta.dataos ? new Date(coleta.dataos).toLocaleDateString('pt-BR') : '---'}</td>
                      <td>{coleta.contato?.nome || 'Cliente não encontrado'}</td>
                      <td>{coleta.vendedor?.nome || '---'}</td>
                      <td><span className="badge-info highlight">{(coleta.pneus?.length || 0)} pneu(s)</span></td>
                      <td className="valor-cell-readonly">R$ {parseFloat((coleta.vtotal || 0).toString()).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge-item status-${coleta.sincronizado ? 'pronto' : 'aguardando'}`}>
                          {coleta.sincronizado ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="td-actions">
                        <button className="icon-btn edit" onClick={(e) => { e.stopPropagation(); openModal('edit', coleta); }} title="Editar"><Edit2 size={18} /></button>
                        <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(coleta.id); }} title="Excluir"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content full-screen" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <ClipboardList className="header-icon" />
                <h2>{modalMode === 'create' ? 'Nova Coleta' : `Detalhes da Coleta #${currentId}`}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="coleta-form">
              <div className="modal-body scrollable" style={{ position: 'relative' }}>
                {formError && (
                  <div className="error-banner" style={{ 
                    backgroundColor: '#fef2f2', 
                    color: '#ef4444', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    border: '1px solid #fee2e2',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
                    animation: 'slideDown 0.3s ease-out'
                  }}>
                    <AlertCircle size={20} />
                    <span>{formError}</span>
                  </div>
                )}
                
                <div className="coleta-master-section">
                  <div className="form-grid-coleta">
                    <div className="form-group span-2">
                      <label htmlFor="id_contato">Cliente da Coleta *</label>
                      <select id="id_contato" className="form-input" value={formData.id_contato} onChange={handleChange} required>
                        <option value="0">Selecione o Cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id_contato}>{c.nome}</option>)}
                      </select>
                    </div>

                    <div className="form-group span-2">
                      <label htmlFor="id_vendedor">Vendedor Responsável</label>
                      <select id="id_vendedor" className="form-input" value={formData.id_vendedor} onChange={handleChange}>
                        <option value="0">Selecione o Vendedor...</option>
                        {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                      </select>
                    </div>

                    <div className="form-group span-4">
                      <label htmlFor="msgmob">Observações Gerais (Mobile)</label>
                      <textarea id="msgmob" className="form-input" rows={2} value={formData.msgmob} onChange={handleChange} placeholder="Anotações para a coleta..." />
                    </div>

                    <div className="form-group span-4 section-divider mt-2">
                      <span className="divider-label">Dados Detalhados da OS (Capturados via OCR)</span>
                    </div>

                    <div className="form-group">
                      <label>Número OS</label>
                      <input id="numeroos" className="form-input" type="number" value={formData.numeroos} onChange={handleChange} disabled={modalMode === 'edit'} />
                    </div>
                    <div className="form-group">
                      <label>CPF / CNPJ</label>
                      <input id="cpfcnpj" className="form-input" value={formData.cpfcnpj} onChange={handleChange} />
                    </div>
                    <div className="form-group span-2">
                      <label>Nome / Razão Social</label>
                      <input id="nome" className="form-input" value={formData.nome} onChange={handleChange} />
                    </div>

                    <div className="form-group span-2">
                      <label>Endereço</label>
                      <input id="endereco" className="form-input" value={formData.endereco} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Cidade</label>
                      <input id="cidade" className="form-input" value={formData.cidade} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>UF</label>
                      <input id="uf" className="form-input" maxLength={2} value={formData.uf} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                      <label>Telefone</label>
                      <input id="fone" className="form-input" value={formData.fone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Veículo (Placa)</label>
                      <input id="veiculo" className="form-input" value={formData.veiculo} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Forma Pgto</label>
                      <input id="formapagto" className="form-input" value={formData.formapagto} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Vendedor (OCR)</label>
                      <input id="vendedor_ocr" className="form-input" value={formData.vendedor_ocr} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                      <label>Tipo Veículo</label>
                      <input id="tipoveiculo" className="form-input" value={formData.tipoveiculo} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Garantia?</label>
                      <input id="servicocomgarantia" className="form-input" value={formData.servicocomgarantia} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Somente Par?</label>
                      <input id="somentesepar" className="form-input" value={formData.somentesepar} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Altera Des.?</label>
                      <input id="podealterardesenho" className="form-input" value={formData.podealterardesenho} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="coleta-detail-section">
                  <div className="section-title-bar">
                    <div className="title-left">
                      <Package size={18} />
                      <h3>Pneus Coletados</h3>
                      <span className="item-count">{formData.pneus.length} itens</span>
                    </div>
                    <button type="button" className="btn-add-item" onClick={() => openPneuModal(null)}>
                      <Plus size={16} /> Adicionar Pneu
                    </button>
                  </div>

                  <div className="pneus-grid-container">
                    <table className="pneus-table readonly">
                      <thead>
                        <tr>
                          <th>Medida / Marca</th>
                          <th>Desenho / Resumo</th>
                          <th>Série / Fogo / DOT</th>
                          <th>Valor Previsto</th>
                          <th>Medida Nova</th>
                          <th>Desenho Novo</th>
                          <th style={{ width: '100px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.pneus.length === 0 ? (
                          <tr><td colSpan={7} className="empty-pneus">Nenhum pneu incluído nesta coleta.</td></tr>
                        ) : (
                          formData.pneus.map((p: any, idx: number) => (
                            <tr key={idx}>
                              <td>
                                <div className="pneu-info-cell">
                                  <span className="primary-info" style={{ color: '#2563eb', fontWeight: 'bold' }}>
                                    {p.id_medida > 0 
                                      ? (medidas.find(m => m.id === parseInt(p.id_medida))?.descricao || 'Sem Medida') 
                                      : '---'}
                                  </span>
                                  <span className="secondary-info" style={{ color: '#3b82f6' }}>
                                    {p.id_marca > 0 
                                      ? (marcas.find(m => m.id === parseInt(p.id_marca))?.descricao || 'Sem Marca') 
                                      : '---'}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="pneu-info-cell">
                                  <span className="primary-info" style={{ color: '#2563eb', fontWeight: 'bold' }}>
                                    {p.id_desenho > 0 
                                      ? (desenhos.find(d => d.id === parseInt(p.id_desenho))?.descricao || 'Sem Desenho') 
                                      : '---'}
                                  </span>
                                  <span className="secondary-info" style={{ marginTop: '4px' }}>Recap: {tiposRecap.find(tr => tr.id === parseInt(p.id_recap))?.descricao || '---'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="pneu-info-cell">
                                  <span className="badge-info">SÉRIE: {p.numserie || '---'}</span>
                                  <span className="badge-info highlight">FOGO: {p.numfogo || '---'}</span>
                                  <span className="badge-info">DOT: {p.dot || '---'}</span>
                                </div>
                              </td>
                              <td className="valor-cell-readonly">R$ {parseFloat(p.valor || 0).toFixed(2)}</td>
                              <td>
                                {p.medidanova ? (
                                  <span className="badge-new-field" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                    {p.medidanova}
                                  </span>
                                ) : <span style={{ color: '#64748b' }}>---</span>}
                              </td>
                              <td>
                                {p.desenhonovo ? (
                                  <span className="badge-new-field" style={{ color: '#10b981' }}>
                                    {p.desenhonovo}
                                  </span>
                                ) : <span style={{ color: '#64748b' }}>---</span>}
                              </td>
                              <td>
                                <div className="action-buttons-inline">
                                  <button type="button" className="icon-btn edit" onClick={() => openPneuModal(idx)} title="Editar"><Edit2 size={16} /></button>
                                  <button type="button" className="icon-btn delete" onClick={() => removePneu(idx)} title="Excluir"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid-summary-bar">
                    <div className="coleta-summary">
                      <div className="summary-item">
                        <span className="label">Total de Pneus</span>
                        <span className="value">{formData.pneus.length} unid.</span>
                      </div>
                      <div className="summary-item total">
                        <span className="label">Valor Previsto Total</span>
                        <span className="value">R$ {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button type="button" className="btn-secondary-compact" onClick={() => setIsModalOpen(false)}>
                      Sair sem Salvar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer-coleta">
                <div style={{ flex: 1 }}></div>
                <div className="footer-btns">
                  <button type="submit" className="btn-primary-coleta" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : (modalMode === 'create' ? 'Gravar Coleta' : 'Salvar Alterações')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL DE EDIÇÃO DE PNEU MOBPNEU */}
      {isPneuModalOpen && (
        <div className="modal-overlay sub-modal" onClick={() => setIsPneuModalOpen(false)}>
          <div className="modal-content pneu-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <Shield className="header-icon" />
                <h2>{editingPneuIndex !== null ? 'Inspeção do Pneu (Edição)' : 'Inspeção do Pneu (Novo)'}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsPneuModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="modal-body pneu-modal-scroll">
              <div className="pneu-form-grid">
                
                {/* Identificação Básica */}
                <div className="form-group span-4 section-divider">
                  <span className="divider-label">Identificação Principal</span>
                </div>

                <div className="form-group span-2">
                  <label>Medida Atual *</label>
                  <select className="form-input" value={tempPneu.id_medida} onChange={(e) => handleTempPneuChange('id_medida', e.target.value)}>
                    <option value="0">Selecione...</option>
                    {medidas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Marca Original *</label>
                  <select className="form-input" value={tempPneu.id_marca} onChange={(e) => handleTempPneuChange('id_marca', e.target.value)}>
                    <option value="0">Selecione...</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Número de Série</label>
                  <input className="form-input uppercase" value={tempPneu.numserie} onChange={(e) => handleTempPneuChange('numserie', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group">
                  <label>Número de Fogo</label>
                  <input className="form-input highlight-field" value={tempPneu.numfogo} onChange={(e) => handleTempPneuChange('numfogo', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group">
                  <label>DOT</label>
                  <input className="form-input uppercase" value={tempPneu.dot} onChange={(e) => handleTempPneuChange('dot', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group">
                  <label>Desenho Original</label>
                  <input className="form-input" value={tempPneu.doriginal} onChange={(e) => handleTempPneuChange('doriginal', e.target.value.toUpperCase())} />
                </div>

                {/* Campos para Novos Cadastros */}
                {((!tempPneu.id_medida || tempPneu.id_medida === "0" || tempPneu.id_medida === 0) || tempPneu.medidanova) && (
                  <div className="form-group span-2">
                    <label style={{ color: '#10b981' }}>Medida (Sugestão IA / Nova)</label>
                    <input className="form-input" style={{ borderColor: '#10b981' }} value={tempPneu.medidanova} onChange={(e) => handleTempPneuChange('medidanova', e.target.value.toUpperCase())} />
                  </div>
                )}

                {((!tempPneu.id_marca || tempPneu.id_marca === "0" || tempPneu.id_marca === 0) || tempPneu.marcanova) && (
                  <div className="form-group span-2">
                    <label style={{ color: '#10b981' }}>Marca (Sugestão IA / Nova)</label>
                    <input className="form-input" style={{ borderColor: '#10b981' }} value={tempPneu.marcanova} onChange={(e) => handleTempPneuChange('marcanova', e.target.value.toUpperCase())} />
                  </div>
                )}

                {((!tempPneu.id_desenho || tempPneu.id_desenho === "0" || tempPneu.id_desenho === 0) || tempPneu.desenhonovo) && (
                  <div className="form-group span-2">
                    <label style={{ color: '#10b981' }}>Desenho (Sugestão IA / Novo)</label>
                    <input className="form-input" style={{ borderColor: '#10b981' }} value={tempPneu.desenhonovo} onChange={(e) => handleTempPneuChange('desenhonovo', e.target.value.toUpperCase())} />
                  </div>
                )}

                {/* Serviços Solicitados */}
                <div className="form-group span-4 section-divider mt-2">
                  <span className="divider-label">Serviço Desejado</span>
                </div>

                <div className="form-group span-2">
                  <label>Desenho Indicado</label>
                  <select className="form-input" value={tempPneu.id_desenho} onChange={(e) => handleTempPneuChange('id_desenho', e.target.value)}>
                    <option value="0">Selecione...</option>
                    {desenhos.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Tipo de Recapagem</label>
                  <select className="form-input" value={tempPneu.id_recap} onChange={(e) => handleTempPneuChange('id_recap', e.target.value)}>
                    <option value="0">Selecione...</option>
                    {tiposRecap.map(tr => <option key={tr.id} value={tr.id}>{tr.descricao}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Valor Previsto (R$)</label>
                  <div className="input-with-icon">
                    <DollarSign size={16} className="field-icon" />
                    <input className="form-input" type="number" step="0.01" value={tempPneu.valor} onChange={(e) => handleTempPneuChange('valor', e.target.value)} />
                  </div>
                </div>

                {/* Dados de Inspeção MobPneu */}
                <div className="form-group span-4 section-divider mt-2">
                  <span className="divider-label">Dados de Inspeção / Técnico</span>
                </div>

                <div className="form-group">
                  <label>Piso</label>
                  <input className="form-input" value={tempPneu.piso} onChange={(e) => handleTempPneuChange('piso', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group">
                  <label>Uso</label>
                  <input className="form-input" value={tempPneu.uso} onChange={(e) => handleTempPneuChange('uso', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group">
                  <label>Qtd. Reformas Anteriores</label>
                  <input className="form-input" type="number" value={tempPneu.qreforma} onChange={(e) => handleTempPneuChange('qreforma', e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Tipo Garantia</label>
                  <input className="form-input" value={tempPneu.garantia} onChange={(e) => handleTempPneuChange('garantia', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group span-2">
                  <label>Medida Nova (Trocada)</label>
                  <input className="form-input" value={tempPneu.medidanova} onChange={(e) => handleTempPneuChange('medidanova', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group span-2">
                  <label>Marca Nova (Trocada)</label>
                  <input className="form-input" value={tempPneu.marcanova} onChange={(e) => handleTempPneuChange('marcanova', e.target.value.toUpperCase())} />
                </div>

                <div className="form-group span-4">
                  <label>Observação / Laudo Visual</label>
                  <div className="input-with-icon">
                    <Info size={16} className="field-icon" style={{ top: '0.8rem' }} />
                    <textarea className="form-input" rows={2} style={{ paddingLeft: '2.5rem' }} value={tempPneu.obs} onChange={(e) => handleTempPneuChange('obs', e.target.value)} />
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsPneuModalOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={savePneu}>
                {editingPneuIndex !== null ? 'Confirmar Edição' : 'Adicionar ao Lote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LEITURA OCR */}
      {isOCRModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsOCRModalOpen(false); setOcrPreview(null); }}>
          <div className="modal-content ocr-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header ocr-header">
              <div className="header-title-group">
                <Camera className="header-icon" />
                <h2>Leitura OCR Inteligente</h2>
              </div>
              <button className="close-btn" onClick={() => { setIsOCRModalOpen(false); setOcrPreview(null); }}><X size={24} /></button>
            </div>

            <div className="modal-body ocr-body">
              <p className="ocr-instruction">Capture ou selecione uma imagem do pneu para processamento.</p>
              
              <div className="ocr-top-actions">
                <button className="btn-camera-action primary" onClick={handleCameraClick}>
                  <Camera size={20} /> Usar Câmera / Scan
                </button>
              </div>

              <div className="ocr-upload-zone" onClick={handleOCRFileClick}>
                {ocrPreview ? (
                  <img src={ocrPreview} alt="Preview OCR" className="ocr-image-preview" />
                ) : (
                  <div className="ocr-placeholder">
                    <div className="upload-icon-container">
                      <Plus size={40} className="text-primary" />
                    </div>
                    <span>Clique para buscar arquivo de imagem</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={ocrFileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*" 
                  onChange={handleOCRFileChange} 
                />
              </div>

              {ocrPreview && (
                <>
                  <div className="ocr-instruction-section" style={{ marginTop: '1rem', width: '100%' }}>
                    <label className="memo-label" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Instruções Adicionais (Opcional)</label>
                    <textarea 
                      className="form-input" 
                      rows={2} 
                      value={ocrInstructions} 
                      onChange={(e) => setOcrInstructions(e.target.value)}
                      placeholder="Ex: Pegue só o número à esquerda..."
                      style={{ width: '100%', resize: 'vertical', marginTop: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    />
                  </div>
                  <div className="ocr-middle-actions">
                    <button className="btn-change-image" onClick={handleOCRFileClick}>
                      Trocar Arquivo
                    </button>
                    <button 
                      className="btn-send-ia" 
                      onClick={handleProcessOCR}
                      disabled={isScanning}
                    >
                      {isScanning ? <Loader2 className="spinning" size={18} /> : null}
                      Enviar Para IA
                    </button>
                  </div>
                </>
              )}

              <div className="ocr-result-section">
                <label className="memo-label">Retorno da IA (Processamento)</label>
                <textarea 
                  className="ocr-memo-field" 
                  rows={6} 
                  value={ocrResultText} 
                  readOnly 
                  placeholder="O resultado do processamento aparecerá aqui..."
                />
              </div>
            </div>

            <div className="modal-footer ocr-footer">
              <button className="btn-secondary" onClick={() => { setIsOCRModalOpen(false); setOcrPreview(null); setOcrResultText(''); setOcrInstructions(''); }}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE DE IMPRESSÃO - OCULTO NA TELA */}
      {selectedColeta && (
        <div className="print-template">
          <div className="print-header">
            <div className="print-logo-section">
              <ClipboardList size={40} className="text-primary" />
              <div>
                <h2>TOTALCAP - GESTÃO DE RECAPAGENS</h2>
                <p>Comprovante de Coleta de Pneus (MobVenda)</p>
              </div>
            </div>
            <div className="print-id-section">
              <span className="print-id-label">COLETA</span>
              <span className="print-id-value">#{selectedColeta.id}</span>
            </div>
          </div>

          <div className="print-info-grid">
            <div className="info-block">
              <span className="info-label">CLIENTE</span>
              <span className="info-value">{selectedColeta.contato?.nome || 'Não informado'}</span>
            </div>
            <div className="info-block">
              <span className="info-label">DATA DA COLETA</span>
              <span className="info-value">{new Date(selectedColeta.dataos).toLocaleString('pt-BR')}</span>
            </div>
            <div className="info-block">
              <span className="info-label">VENDEDOR</span>
              <span className="info-value">{selectedColeta.vendedor?.nome || '---'}</span>
            </div>
            <div className="info-block">
              <span className="info-label" style={{ gridColumn: 'span 3' }}>OBSERVAÇÕES</span>
              <span className="info-value">{selectedColeta.msgmob || 'Sem observações adicionais.'}</span>
            </div>
          </div>

          <table className="print-table">
            <thead>
              <tr>
                <th>MEDIDA / MARCA</th>
                <th>SÉRIE / FOGO</th>
                <th>DESENHO INDICADO</th>
                <th>RECAPAGEM</th>
                <th>VALOR PREVISTO</th>
              </tr>
            </thead>
            <tbody>
              {selectedColeta.pneus.map((p, idx) => (
                <tr key={idx}>
                  <td>
                    {medidas.find(m => m.id === Number(p.id_medida))?.descricao || '---'}<br/>
                    <small>{marcas.find(m => m.id === Number(p.id_marca))?.descricao || '---'}</small>
                  </td>
                  <td>
                    {p.numserie || '---'}<br/>
                    <small>FOGO: {p.numfogo || '---'}</small>
                  </td>
                  <td>{desenhos.find(d => d.id === Number(p.id_desenho))?.descricao || '---'}</td>
                  <td>{tiposRecap.find(tr => tr.id === Number(p.id_recap))?.descricao || '---'}</td>
                  <td align="right">R$ {Number(p.valor).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} align="right"><strong>RESUMO TOTAL ({selectedColeta.pneus.length} Pneus):</strong></td>
                <td align="right"><strong>R$ {Number(selectedColeta.vtotal).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>

          <div className="print-signatures">
            <div className="signature-box">
              <div className="signature-line"></div>
              <span>Assinatura do Cliente</span>
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <span>Responsável Totalcap</span>
            </div>
          </div>
          
          <div className="print-footer">
            <p>Impresso em {new Date().toLocaleString('pt-BR')} - Sistema Totalcap Cloud</p>
          </div>
        </div>
      )}
    </div>
  );
}
