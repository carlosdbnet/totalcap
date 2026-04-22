import { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Search, Edit2, Trash2, X, Eye,
  CheckCircle, Calendar, User, DollarSign, Package,
  ChevronRight, Save, Clock, Phone, MapPin, Hash, Settings, Mail,
  Briefcase, Loader2, AlertCircle, FileText
} from 'lucide-react';
import api from '../lib/api';
import './OrdemServico.css';

interface OrcamentoItem {
  id?: number;
  id_medida?: number;
  id_desenho?: number;
  id_recap?: number;
  descricao?: string;
  medida?: string;
  marca?: string;
  servico?: string;
  desenho?: string;
  numfogo?: string;
  dot?: string;
  quant: number;
  valor: number;
  vrtotal: number;
  vrproduto?: number;
  vrcarcaca?: number;
  vrbonus?: number;
  vrmontagem?: number;
  pcomissao?: number;
  vrcomissao?: number;
  id_ospneu?: number;
  numserie?: string;
}

interface OrcamentoData {
  id?: number;
  id_contato?: number;
  id_ordem?: number;
  id_vendedor?: number;
  datamov: string;
  vtotal: number;
  vdesconto?: number;
  validade?: string;
  condicao?: string;
  obs?: string;
  
  nome?: string;
  nomeresp?: string;
  foneresp?: string;
  email1?: string;
  email2?: string;
  
  rua?: string;
  numcasa?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  cxpostal?: string;
  
  foneres?: string;
  fonecom?: string;
  fax?: string;
  celular?: string;
  contato?: string;
  
  items: OrcamentoItem[];
}

export default function Orcamento() {
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<any>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);
  const [desenhos, setDesenhos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  
  const [clienteSearch, setClienteSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [osStatus, setOsStatus] = useState<{loading: boolean, error?: string, cliente?: string}>({loading: false});

  const [formData, setFormData] = useState<OrcamentoData>({
    datamov: new Date().toISOString().split('T')[0],
    vtotal: 0,
    items: []
  });

  const [itemForm, setItemForm] = useState<OrcamentoItem>({
    quant: 1,
    valor: 0,
    vrtotal: 0
  });

  const fetchData = async () => {
    try {
      const [resOrcam, resClie, resVend, resMed, resDes, resServ] = await Promise.all([
        api.get('/orcamentos/'),
        api.get('/clientes/'),
        api.get('/vendedores/'),
        api.get('/medidas/'),
        api.get('/desenhos/'),
        api.get('/servicos/')
      ]);
      setOrcamentos(resOrcam.data);
      setClientes(resClie.data);
      setVendedores(resVend.data);
      setMedidas(resMed.data);
      setDesenhos(resDes.data);
      setServicos(resServ.data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Validação de OS com Debounce
  useEffect(() => {
    if (!isModalOpen || !editingOrcamento) return;
    const timer = setTimeout(() => {
        if (formData.id_ordem) {
            validateOS(formData.id_ordem);
        } else {
            setOsStatus({loading: false});
        }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.id_ordem, isModalOpen, editingOrcamento]);

  const validateOS = async (id: number) => {
    setOsStatus({loading: true, error: undefined, cliente: undefined});
    try {
      const res = await api.get(`/ordens-servico/${id}`);
      const os = res.data;
      if (os && os.id_contato) {
        setOsStatus({loading: false, cliente: os.contato_nome || "Cliente Vínculado"});
        // Aloca id_contato da OS para o orçamento
        setFormData((prev: any) => ({ ...prev, id_contato: os.id_contato }));
        // Preenche o contato a partir da OS
        const cliente = clientes.find(c => c.id === os.id_contato);
        if (cliente) {
          applyClientSnapshot(cliente);
        } else {
          try {
            const resClie = await api.get(`/clientes/${os.id_contato}`);
            if (resClie.data) applyClientSnapshot(resClie.data);
          } catch (e) {
            console.error("Erro ao carregar cliente da OS:", e);
          }
        }
        // Carrega os pneus da OS e gera itens do orçamento
        const pneusOS = os.pneus || [];
        if (pneusOS.length > 0) {
          const itensOS = pneusOS.map((p: any) => ({
            id_ospneu: p.id,
            id_medida: p.id_medida,
            id_desenho: p.id_desenho,
            id_recap: p.id_recap,
            descricao: p.descricao || '',
            medida: medidas?.find((m: any) => m.id === p.id_medida)?.descricao || '',
            marca: p.marca || '',
            servico: p.servico || '',
            desenho: desenhos?.find((d: any) => d.id === p.id_desenho)?.descricao || '',
            numfogo: p.numfogo || '',
            dot: p.dot || '',
            numserie: p.numserie || '',
            quant: 1,
            valor: Number(p.valor) || 0,
            vrtotal: Number(p.valor) || 0,
            vrproduto: Number(p.vrproduto) || 0,
            vrcarcaca: Number(p.vrcarcaca) || 0,
            vrbonus: Number(p.vrbonus) || 0,
            vrmontagem: Number(p.vrmontagem) || 0,
            pcomissao: Number(p.pcomissao) || 0,
            vrcomissao: Number(p.vrcomissao) || 0
          }));
          const newTotal = itensOS.reduce((sum: number, item: any) => sum + (item.vrtotal || 0), 0);
          setFormData((prev: any) => ({ ...prev, items: itensOS, vtotal: Number(newTotal) }));
        } else {
          setFormData((prev: any) => ({ ...prev, items: [], vtotal: 0 }));
        }
      } else {
        setOsStatus({loading: false, error: "OS sem cliente vinculado"});
        setFormData((prev: any) => ({ ...prev, id_contato: undefined, id_ordem: undefined }));
      }
    } catch (err: any) {
      console.error("Erro validateOS:", err);
      const msg = err.response?.data?.detail || err.message || "OS não localizada";
      setOsStatus({loading: false, error: msg});
      setFormData((prev: any) => ({ ...prev, id_contato: undefined, id_ordem: undefined }));
    }
  };

  const applyClientSnapshot = (c: any) => {
    setClienteSearch(c.nome);
    setFormData(prev => ({
      ...prev, 
      id_contato: c.id, 
      nome: c.nome, 
      nomeresp: c.razaosocial || c.nome,
      foneresp: c.foneprincipal, 
      email1: c.email, 
      email2: c.emailnfe || "",
      rua: c.rua, 
      numcasa: c.numcasa, 
      complemento: c.complemento, 
      bairro: c.bairro, 
      cep: c.cep, 
      cidade: c.cidade, 
      uf: c.uf,
      cxpostal: c.cxpostal || "",
      foneres: c.foneauxiliar || "",
      fonecom: c.fonecomercial || "",
      fax: c.fax || "",
      celular: c.celular || "",
      contato: c.contato || ""
    }));
    setShowSuggestions(false);
  };

  const handleOpenModal = async (orcamento: any = null, view: boolean = false) => {
    setViewMode(view);
    setOsStatus({loading: false});
    if (orcamento) {
      try {
        const res = await api.get(`/orcamentos/${orcamento.id}/`);
        const data = res.data;
        setEditingOrcamento(data);
        const datamovDate = data.datamov ? (typeof data.datamov === 'string' ? data.datamov.split('T')[0] : new Date(data.datamov).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
        setFormData({
          ...data,
          datamov: datamovDate,
          vtotal: Number(data.vtotal) || 0,
          items: data.items || []
        });
        setClienteSearch(data.contato_nome || data.nome || "");
      } catch (err) {
        console.error("Erro ao carregar orçamento:", err);
        setEditingOrcamento(orcamento);
        const datamovDate = orcamento.datamov ? (typeof orcamento.datamov === 'string' ? orcamento.datamov.split('T')[0] : new Date(orcamento.datamov).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
        setFormData({
          ...orcamento,
          datamov: datamovDate,
          vtotal: Number(orcamento.vtotal) || 0,
          items: orcamento.items || []
        });
        setClienteSearch(orcamento.contato_nome || orcamento.nome || "");
      }
    } else {
      setEditingOrcamento(null);
      setFormData({
        datamov: new Date().toISOString().split('T')[0],
        vtotal: 0,
        items: []
      });
      setClienteSearch("");
    }
    setIsModalOpen(true);
  };

  const handleOpenItemModal = (index: number | null = null) => {
    if (index !== null) {
      setEditingItemIndex(index);
      setItemForm({ ...formData.items[index] });
    } else {
      setEditingItemIndex(null);
      setItemForm({ quant: 1, valor: 0, vrtotal: 0 });
    }
    setIsItemModalOpen(true);
  };

  const saveItem = () => {
    const medidaNome = medidas.find(m => m.id === itemForm.id_medida)?.descricao || "";
    const desenhoNome = desenhos.find(d => d.id === itemForm.id_desenho)?.descricao || "";

    const newItem = {
      ...itemForm,
      medida: medidaNome,
      desenho: desenhoNome,
      vrtotal: Number((itemForm.quant || 1) * (itemForm.valor || 0))
    };

    let newItems;
    if (editingItemIndex !== null) {
      newItems = [...formData.items];
      newItems[editingItemIndex] = newItem;
    } else {
      newItems = [...formData.items, newItem];
    }

    const newTotal = Number(newItems.reduce((sum: number, item: any) => sum + (item.vrtotal || 0), 0));
    setFormData({ ...formData, items: newItems, vtotal: newTotal });
    setIsItemModalOpen(false);
  };

  const removeItem = (index: number) => {
    if (!window.confirm("Remover este item?")) return;
    const newItems = formData.items.filter((_: any, i: number) => i !== index);
    const newTotal = Number(newItems.reduce((sum: number, item: any) => sum + (item.vrtotal || 0), 0));
    setFormData({ ...formData, items: newItems, vtotal: newTotal });
  };

  const handleSaveOrcamento = async () => {
    try {
      if (editingOrcamento) {
        await api.put(`/orcamentos/${editingOrcamento.id}/`, formData);
      } else {
        await api.post('/orcamentos/', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  const handleDeleteOrcamento = async (id: number) => {
    if (!window.confirm("Excluir este orçamento?")) return;
    try {
      await api.delete(`/orcamentos/${id}/`);
      fetchData();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const handlePrintProposta = async (orcamento: any) => {
    try {
      const res = await api.get(`/orcamentos/${orcamento.id}/`);
      const data = res.data;
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Proposta Comercial - ${data.id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2b6cb0; padding-bottom: 15px; margin-bottom: 20px; }
              .company { display: flex; align-items: center; gap: 15px; }
              .company img { height: 60px; }
              .company-info h1 { color: #2b6cb0; font-size: 24px; margin: 0; }
              .company-info p { color: #718096; font-size: 11px; margin: 0; }
              .meta { text-align: right; }
              .meta h2 { font-size: 20px; color: #2d3748; }
              .meta p { font-size: 14px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 4px; }
              .box h3 { font-size: 12px; color: #4a5568; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
              .item { font-size: 12px; margin-bottom: 5px; }
              .item b { color: #2d3748; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th { background: #2d3748; color: white; padding: 10px; text-align: left; font-size: 12px; }
              td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 12px; }
              .total-box { float: right; width: 250px; border: 2px solid #2d3748; padding: 15px; border-radius: 4px; }
              .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; }
              .total-row.total { border-top: 1px solid #2d3748; padding-top: 10px; font-size: 18px; font-weight: bold; color: #2b6cb0; }
              .terms { margin-top: 30px; }
              .terms h3 { font-size: 14px; color: #2d3748; border-left: 4px solid #2b6cb0; padding-left: 10px; }
              .signature { display: flex; justify-content: space-around; margin-top: 50px; }
              .sig-box { width: 200px; text-align: center; border-top: 1px solid #2d3748; padding-top: 10px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company">
                <img src="${window.location.origin}/src/assets/images/LogoEmpresa.png" alt="Logo" />
                <div class="company-info">
                  <h1>TOTALCAP</h1>
                  <p>Reforma de Pneus e Serviços Automotivos</p>
                  <p>CNPJ: 00.000.000/0000-00 | Fone: (00) 0000-0000</p>
                </div>
              </div>
              <div class="meta">
                <h2>PROPOSTA COMERCIAL</h2>
                <p>Nº <b>${data.id}</b></p>
                <p>Emissão: ${new Date(data.datamov).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div class="grid">
              <div class="box">
                <h3>DADOS DO CLIENTE</h3>
                <div class="item"><b>Cliente:</b> ${data.nome}</div>
                <div class="item"><b>Endereço:</b> ${data.rua || ''}, ${data.numcasa || ''} - ${data.bairro || ''}</div>
                <div class="item"><b>Cidade/UF:</b> ${data.cidade || ''} / ${data.uf || ''}</div>
                <div class="item"><b>CNPJ/CPF:</b> ${data.cpfcnpj || '---'}</div>
                <div class="item"><b>Fone:</b> ${data.foneresp || data.celular || '---'}</div>
                <div class="item"><b>Email:</b> ${data.email1 || '---'}</div>
              </div>
              <div class="box">
                <h3>DETALHES DO ORÇAMENTO</h3>
                <div class="item"><b>Vendedor:</b> ${data.vendedor_nome || '---'}</div>
                <div class="item"><b>Validade:</b> ${data.validade || '---'}</div>
                <div class="item"><b>Condição Pagto:</b> ${data.condicao || 'À Vista'}</div>
                <div class="item"><b>Referência OS:</b> ${data.id_ordem || '---'}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Descrição do Serviço/Peça</th>
                  <th>Qtd</th>
                  <th>Vlr. Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${(data.items || []).map((item: any) => `
                  <tr>
                    <td><b>${item.medida || item.descricao || '---'}</b>${item.servico ? '<br><small>' + item.servico + '</small>' : ''}${item.numserie ? '<br><small>Série: ' + item.numserie + '</small>' : ''}</td>
                    <td>${item.quant}</td>
                    <td>R$ ${Number(item.valor || 0).toFixed(2)}</td>
                    <td><b>R$ ${Number(item.vrtotal || 0).toFixed(2)}</b></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-box">
              <div class="total-row"><span>Subtotal:</span><span>R$ ${Number(data.vtotal || 0).toFixed(2)}</span></div>
              ${data.vdesconto > 0 ? '<div class="total-row" style="color:#e53e3e"><span>Desconto:</span><span>- R$ ' + Number(data.vdesconto).toFixed(2) + '</span></div>' : ''}
              <div class="total-row total"><span>TOTAL:</span><span>R$ ${Number(data.vtotal - (data.vdesconto || 0)).toFixed(2)}</span></div>
            </div>
            <div style="clear:both"></div>
            ${data.obs ? '<div class="terms"><h3>Observações</h3><p style="font-size:12px;color:#4a5568">' + data.obs + '</p></div>' : ''}
            <div class="signature">
              <div class="sig-box"><b>TOTALCAP</b><p>Responsável</p></div>
              <div class="sig-box"><b>' + data.nome + '</b><p>Cliente</p></div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (err) {
      console.error("Erro ao carregar orçamento:", err);
    }
  };

  return (
    <div className="p-6">
      {/* Conteúdo da Tela */}
      <div className="flex flex-row justify-between items-center w-full mb-6 text-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-primary-light p-2 rounded-lg text-primary"><Calculator size={28} /></div>
          <div>
            <h1 className="text-2xl font-bold">Orçamentos Comercial</h1>
            <p className="text-slate-500 text-sm">Controle de propostas e faturamento integrado</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}><Plus size={20} /> Novo Orçamento</button>
      </div>

      <div className="glass-panel overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th style={{ textAlign: 'right' }}>Total (R$)</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Carregando...</td></tr>
            ) : orcamentos.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum registro.</td></tr>
            ) : (
              orcamentos.map(o => (
                <tr key={o.id}>
                  <td className="font-bold text-slate-400">#{o.id}</td>
                  <td>{new Date(o.datamov).toLocaleDateString()}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-semibold">{o.contato_nome || o.nome}</span>
                      {o.foneresp && <span className="text-xs text-slate-400">{o.foneresp}</span>}
                    </div>
                  </td>
                  <td><span className="badge-info">{o.vendedor_nome || '---'}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    R$ {parseFloat(o.vtotal).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                      <button className="btn-icon" title="Imprimir Proposta" onClick={() => handlePrintProposta(o)} style={{ padding: '4px' }}><FileText size={16} /></button>
                      <button className="btn-icon" title="Visualizar" onClick={() => handleOpenModal(o, true)} style={{ padding: '4px' }}><Eye size={16} /></button>
                      <button className="btn-icon" title="Editar" onClick={() => handleOpenModal(o, false)} style={{ padding: '4px' }}><Edit2 size={16} /></button>
                      <button className="btn-icon text-red-500" title="Excluir" onClick={() => handleDeleteOrcamento(o.id)} style={{ padding: '4px' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '1200px', height: '95vh' }}>
            <div className="modal-header">
              <h2>{editingOrcamento ? (viewMode ? `Visualizar Orçamento #${editingOrcamento?.id || '?'}` : `Editar Orçamento #${editingOrcamento?.id || '?'}`) : 'Novo Orçamento'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="modal-body overflow-y-auto overflow-x-hidden p-6">
              <div className="section-title">Dados do Cliente e Identificação</div>
              <div className="form-grid-os mb-6">
                <div className="form-group span-1">
                  <label><Hash size={14} /> ID Ordem (OS)</label>
                  <div className="relative">
                    <input 
                      type="number" className={`form-input ${osStatus.error ? 'border-red-500' : osStatus.cliente ? 'border-emerald-500' : ''}`} 
                      placeholder="ID da OS" 
                      value={formData.id_ordem || ""} 
                      onChange={e => viewMode ? null : setFormData({...formData, id_ordem: parseInt(e.target.value) || undefined})}
                      disabled={viewMode}
                    />
                    <div className="absolute right-3 top-2.5 flex items-center gap-1">
                        {osStatus.loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        {osStatus.cliente && <CheckCircle size={16} className="text-emerald-500" />}
                        {osStatus.error && <AlertCircle size={16} className="text-red-500" />}
                    </div>
                    {osStatus.cliente && <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase italic">{osStatus.cliente}</p>}
                    {osStatus.error && <p className="text-[10px] text-red-600 font-bold mt-1 uppercase italic">{osStatus.error}</p>}
                  </div>
                </div>
                <div className="form-group span-2 relative">
                  <label><User size={14} /> Busca Cliente Cadastrado</label>
                  <div className="input-with-icon">
                    <Search className="field-icon" size={16} />
                    <input 
                      type="text" className="form-input" placeholder="Busque pelo nome..." 
                      value={clienteSearch}
                      onChange={(e) => {setClienteSearch(e.target.value); setShowSuggestions(true);}}
                      onFocus={() => setShowSuggestions(true)}
                      disabled={viewMode}
                    />
                  </div>
                  {showSuggestions && (
                    <div className="suggestions-dropdown glass-panel" style={{ background: 'white', zIndex: 9999, position: 'absolute', width: '100%' }}>
                      {clientes.filter(c => (c.nome||"").toLowerCase().includes(clienteSearch.toLowerCase())).slice(0, 10).map(c => (
                        <div key={c.id} className="suggestion-item" onClick={() => applyClientSnapshot(c)}>
                          <User size={14} className="icon" /> <span>{c.nome}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group span-1">
                  <label><Calendar size={14} /> Data do Orçamento</label>
                  <input type="date" className="form-input" value={formData.datamov} onChange={e => viewMode ? null : setFormData({...formData, datamov: e.target.value})} />
                </div>
                
                <div className="form-group span-2">
                  <label><Briefcase size={14} /> Vendedor Responsável</label>
                  <select 
                    className="form-input" 
                    value={formData.id_vendedor || ""} 
                    onChange={e => viewMode ? null : setFormData({...formData, id_vendedor: parseInt(e.target.value) || undefined})}
                    disabled={viewMode}
                  >
                    <option value="">Selecione o vendedor...</option>
                    {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                  </select>
                </div>

                <div className="form-group span-2">
                    <label><Clock size={14} /> Validade da Proposta</label>
                    <input type="text" className="form-input" placeholder="Ex: 5 dias" value={formData.validade || ""} onChange={e => viewMode ? null : setFormData({...formData, validade: e.target.value})} />
                </div>
              </div>

              <div className="section-title">Endereço de Entrega / Faturamento</div>
              <div className="form-grid-os mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="form-group span-3">
                  <label>Rua / Logradouro</label>
                  <input type="text" className="form-input" value={formData.rua || ""} onChange={e => viewMode ? null : setFormData({...formData, rua: e.target.value})} />
                </div>
                <div className="form-group span-1">
                  <label>Número</label>
                  <input type="text" className="form-input" value={formData.numcasa || ""} onChange={e => viewMode ? null : setFormData({...formData, numcasa: e.target.value})} />
                </div>
                <div className="form-group span-2">
                  <label>Complemento</label>
                  <input type="text" className="form-input" value={formData.complemento || ""} onChange={e => viewMode ? null : setFormData({...formData, complemento: e.target.value})} />
                </div>
                <div className="form-group span-2">
                  <label>Bairro</label>
                  <input type="text" className="form-input" value={formData.bairro || ""} onChange={e => viewMode ? null : setFormData({...formData, bairro: e.target.value})} />
                </div>
                <div className="form-group span-1">
                  <label>CEP</label>
                  <input type="text" className="form-input" value={formData.cep || ""} onChange={e => viewMode ? null : setFormData({...formData, cep: e.target.value})} />
                </div>
                <div className="form-group span-2">
                  <label>Cidade</label>
                  <input type="text" className="form-input" value={formData.cidade || ""} onChange={e => viewMode ? null : setFormData({...formData, cidade: e.target.value})} />
                </div>
                <div className="form-group span-1">
                  <label>Estado (UF)</label>
                  <input type="text" className="form-input" maxLength={2} value={formData.uf || ""} onChange={e => viewMode ? null : setFormData({...formData, uf: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group span-1">
                  <label>Caixa Postal</label>
                  <input type="text" className="form-input" value={formData.cxpostal || ""} onChange={e => viewMode ? null : setFormData({...formData, cxpostal: e.target.value})} />
                </div>
              </div>

              <div className="section-title">Contatos Adicionais</div>
              <div className="form-grid-os mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="form-group span-1">
                  <label><Phone size={14} /> Fone Residencial</label>
                  <input type="text" className="form-input" value={formData.foneres || ""} onChange={e => viewMode ? null : setFormData({...formData, foneres: e.target.value})} />
                </div>
                <div className="form-group span-1">
                  <label><Phone size={14} /> Fone Comercial</label>
                  <input type="text" className="form-input" value={formData.fonecom || ""} onChange={e => viewMode ? null : setFormData({...formData, fonecom: e.target.value})} />
                </div>
                <div className="form-group span-1">
                  <label><Phone size={14} /> Celular</label>
                  <input type="text" className="form-input" value={formData.celular || ""} onChange={e => viewMode ? null : setFormData({...formData, celular: e.target.value})} />
                </div>
                <div className="form-group span-1">
                  <label><Settings size={14} /> FAX</label>
                  <input type="text" className="form-input" value={formData.fax || ""} onChange={e => viewMode ? null : setFormData({...formData, fax: e.target.value})} />
                </div>
                <div className="form-group span-2">
                  <label><Mail size={14} /> E-mail Principal</label>
                  <input type="text" className="form-input" value={formData.email1 || ""} onChange={e => viewMode ? null : setFormData({...formData, email1: e.target.value})} />
                </div>
                <div className="form-group span-2">
                  <label><User size={14} /> Pessoa de Contato</label>
                  <input type="text" className="form-input" value={formData.contato || ""} onChange={e => viewMode ? null : setFormData({...formData, contato: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <div className="section-title mb-0">Itens e Serviços</div>
                <button className="btn-primary" onClick={() => handleOpenItemModal()}>
                   <Plus size={16} /> Novo Item
                </button>
              </div>

              <div className="table-responsive border border-slate-200 rounded-xl overflow-hidden mb-6">
                <table className="data-table small">
                  <thead className="bg-slate-50">
                    <tr>
                      <th>Medida/Peça</th>
                      <th>Serviço</th>
                      <th style={{ textAlign: 'center' }}>Qtd</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.length === 0 ? (
                      <tr><td colSpan={5} className="text-center p-6 text-slate-400">Clique em 'Novo Item' para começar.</td></tr>
                    ) : (
                      formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.medida || item.descricao || '---'}</td>
                          <td>{item.servico || '---'}</td>
                          <td style={{ textAlign: 'center' }}>{item.quant}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$ {parseFloat(String(item.vrtotal)).toFixed(2)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="flex justify-center gap-2">
                              <button className="text-slate-400 hover:text-primary" onClick={() => handleOpenItemModal(idx)}><Edit2 size={14} /></button>
                              <button className="text-red-400 hover:text-red-600" onClick={() => removeItem(idx)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group"><label>Condição de Pagto</label><textarea className="form-input" rows={2} value={formData.condicao} onChange={e => viewMode ? null : setFormData({...formData, condicao: e.target.value})} /></div>
                <div className="form-group"><label>Observações</label><textarea className="form-input" rows={2} value={formData.obs} onChange={e => viewMode ? null : setFormData({...formData, obs: e.target.value})} /></div>
              </div>
            </div>

            <div className="modal-footer bg-slate-50 border-t">
              <div className="flex flex-col items-end mr-auto">
                <span className="text-xs text-slate-400 font-semibold uppercase">Total Geral</span>
                <span className="text-2xl font-bold text-primary">R$ {Number(formData.vtotal || 0).toFixed(2)}</span>
              </div>
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>{viewMode ? 'Fechar' : 'Cancelar'}</button>
              {editingOrcamento && !viewMode && (
                <button type="button" className="btn-secondary border-primary text-primary hover:bg-primary-light" onClick={() => handlePrintProposta(formData)}>
                  <FileText size={18} /> Proposta
                </button>
              )}
              {!viewMode && <button className="btn-primary bg-emerald-500 hover:bg-emerald-600" onClick={handleSaveOrcamento}><CheckCircle size={18} /> Salvar Orçamento</button>}
            </div>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingItemIndex !== null ? 'Editar Item' : 'Novo Item'}</h2>
              <button className="close-btn" onClick={() => setIsItemModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="grid grid-cols-1 gap-4">
                <div className="form-group">
                  <label>Medida do Pneu / Peça</label>
                  <select className="form-input" value={itemForm.id_medida || ""} onChange={e => setItemForm({...itemForm, id_medida: parseInt(e.target.value)})}>
                    <option value="">Selecione a medida...</option>
                    {medidas.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Serviço Pretendido (Texto)</label>
                  <input type="text" className="form-input" value={itemForm.servico || ""} onChange={e => setItemForm({...itemForm, servico: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Quantidade</label>
                    <input type="number" className="form-input" value={itemForm.quant} onChange={e => setItemForm({...itemForm, quant: parseFloat(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Vlr. Unitário (R$)</label>
                    <input type="number" className="form-input" value={itemForm.valor} onChange={e => setItemForm({...itemForm, valor: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="bg-primary-light p-4 rounded-lg flex justify-between items-center mt-2">
                  <span className="text-primary font-semibold">Subtotal:</span>
                  <span className="text-xl font-bold text-primary">R$ {((itemForm.quant || 0) * (itemForm.valor || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsItemModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveItem}><Save size={18} /> Confirmar Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
