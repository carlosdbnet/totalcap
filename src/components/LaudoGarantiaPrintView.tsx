import React from 'react';
import type { Laudo } from '../types/laudo';
import logoEmpresa from '../assets/images/LogoEmpresa.png';
import './LaudoGarantiaPrintView.css';

interface LaudoGarantiaPrintViewProps {
  data: any;
  medidas: any[];
  desenhos: any[];
  tiporecaps: any[];
  clientes: any[];
  empresas: any[];
  servicos: any[];
}

const LaudoGarantiaPrintView: React.FC<LaudoGarantiaPrintViewProps> = ({ 
  data, medidas, desenhos, tiporecaps, clientes, empresas, servicos 
}) => {
  const cliente = clientes.find(c => c.id === data.id_contato) || {};
  const empresa = empresas?.find(e => e.id === data.id_empresa) || empresas?.[0] || {};
  const medida = medidas.find(m => m.id === data.id_medida)?.descricao || '---';
  const desenhoOriginal = data.desenhoriginal || '---';
  const desenhoExecutado = desenhos.find(d => d.id === data.id_desenho)?.descricao || '---';
  const servico = servicos?.find(s => s.id === data.codservico)?.descricao || '---';
  const tipoRecap = tiporecaps.find(t => t.id === data.id_recap)?.descricao || '---';

  const formatCurrency = (val: number | string) => {
    return parseFloat(val?.toString() || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="print-only laudo-garantia-print-container">
      {/* CABEÇALHO */}
      <div className="print-header-garantia">
        <div>
          <img src={logoEmpresa} alt="Logo" style={{ maxWidth: '120px', maxHeight: '50px', objectFit: 'contain' }} />
        </div>
        <div>
          <h1>LAUDO TÉCNICO DE GARANTIA</h1>
        </div>
        <div className="laudo-number-garantia">
          Nº {data.numlaudo}
        </div>
      </div>

      {/* DADOS DA EMPRESA */}
      <div className="section-garantia">
        <h3 className="section-title-garantia">DADOS DA EMPRESA</h3>
        <div className="grid-row-garantia">
          <div style={{ flex: 3 }}><span className="field-label">Razão Social:</span><span className="field-value">{empresa.razaosocial || empresa.nome || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">CNPJ:</span><span className="field-value">{empresa.cnpj || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">I.E:</span><span className="field-value">{empresa.inscestadual || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Telefone:</span><span className="field-value">{empresa.telefone || '---'}</span></div>
        </div>
        <div className="grid-row-garantia">
          <div style={{ flex: 2 }}><span className="field-label">Endereço:</span><span className="field-value">{empresa.endereco || '---'} {empresa.numcasa ? `, ${empresa.numcasa}` : ''}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">CEP:</span><span className="field-value">{empresa.cep || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Município:</span><span className="field-value">{empresa.cidade || '---'}</span></div>
          <div style={{ flex: 0.5 }}><span className="field-label">UF:</span><span className="field-value">{empresa.uf || '---'}</span></div>
        </div>
      </div>

      {/* DADOS DO CLIENTE */}
      <div className="section-garantia">
        <h3 className="section-title-garantia">DADOS DO CLIENTE</h3>
        <div className="grid-row-garantia">
          <div style={{ flex: 3 }}><span className="field-label">Razão Social / Nome:</span><span className="field-value">{cliente.nome || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">CPF / CNPJ:</span><span className="field-value">{cliente.cpfcnpj || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Telefone:</span><span className="field-value">{cliente.foneprincipal || '---'}</span></div>
        </div>
        <div className="grid-row-garantia">
          <div style={{ flex: 2 }}><span className="field-label">Endereço:</span><span className="field-value">{cliente.endereco || '---'} {cliente.numero ? `, ${cliente.numero}` : ''}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">CEP:</span><span className="field-value">{cliente.cep || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Município:</span><span className="field-value">{cliente.cidade || '---'}</span></div>
          <div style={{ flex: 0.5 }}><span className="field-label">UF:</span><span className="field-value">{cliente.uf || '---'}</span></div>
        </div>
      </div>

      {/* ESPECIFICAÇÕES DO PRODUTO / SERVIÇO */}
      <div className="section-garantia">
        <h3 className="section-title-garantia">ESPECIFICAÇÕES DO PNEU E SERVIÇO</h3>
        <div className="grid-row-garantia">
          <div style={{ flex: 1 }}><span className="field-label">OS:</span><span className="field-value">{data.numos}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Nº NF (Serviço):</span><span className="field-value">{data.numnota || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Data NF:</span><span className="field-value">{formatDate(data.datafat)}</span></div>
        </div>
        <div className="grid-row-garantia">
          <div style={{ flex: 1 }}><span className="field-label">Medida:</span><span className="field-value">{medida}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Marca:</span><span className="field-value">{data.marca || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Nº Série:</span><span className="field-value">{data.numserie || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Nº Fogo:</span><span className="field-value">{data.numfogo || '---'}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">DOT:</span><span className="field-value">{data.dot || '---'}</span></div>
        </div>
        <div className="grid-row-garantia">
          <div style={{ flex: 1 }}><span className="field-label">Serviço Realizado:</span><span className="field-value">{servico}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Desenho Original:</span><span className="field-value">{desenhoOriginal}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Desenho Executado:</span><span className="field-value">{desenhoExecutado}</span></div>
        </div>
        <div className="grid-row-garantia">
          <div style={{ flex: 1 }}><span className="field-label">Data de Produção:</span><span className="field-value">{formatDate(data.dataprod)}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Data do Exame:</span><span className="field-value">{formatDate(data.dataexa)}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Nº de Reformas:</span><span className="field-value">{data.qreforma || '0'}</span></div>
        </div>
        <div className="grid-row-garantia">
          <div style={{ flex: 1 }}><span className="field-label">Defeito Reclamado (Alegação):</span><span className="field-value">{data.alegacao || '---'}</span></div>
        </div>
      </div>

      {/* ANÁLISE TÉCNICA E RESULTADO */}
      <div className="section-garantia">
        <h3 className="section-title-garantia">RESULTADO DA AVALIAÇÃO TÉCNICA</h3>
        <div className="grid-row-garantia" style={{ padding: '10px 5px' }}>
          <div style={{ flex: 1, borderRight: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="approval-status-garantia">
              STATUS: 
              <span>[ {data.status === 'A' ? 'X' : ' '} ] PROCEDENTE (APROVADO)</span>
              <span>[ {data.status === 'C' ? 'X' : ' '} ] IMPROCEDENTE (NÃO APROVADO)</span>
            </div>
            <div>
              <span className="field-label">Causa / Motivo do Defeito:</span>
              <span className="field-value">{data.motivo || '---'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RESUMO TÉCNICO E FINANCEIRO */}
      <div className="section-garantia">
        <h3 className="section-title-garantia">RESUMO FINANCEIRO / REPOSIÇÃO</h3>
        <div className="grid-row-garantia">
          <div style={{ flex: 1 }}><span className="field-label">% Desgaste:</span><span className="field-value">{data.percdesg || '0'}%</span></div>
          <div style={{ flex: 1 }}><span className="field-label">% Reposição:</span><span className="field-value">{data.percrepo || '0'}%</span></div>
          <div style={{ flex: 1 }}><span className="field-label">% Reforma:</span><span className="field-value">{data.percrefor || '0'}%</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Tipo Reposição:</span><span className="field-value">{data.tiporepo || '---'}</span></div>
        </div>
        <div className="grid-row-garantia">
          <div style={{ flex: 1 }}><span className="field-label">Valor Original (Serviço):</span><span className="field-value">{formatCurrency(data.vrservico)}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Valor Crédito (Aprovado):</span><span className="field-value">{formatCurrency(data.vrcredito)}</span></div>
          <div style={{ flex: 1 }}><span className="field-label">Saldo Restante:</span><span className="field-value">{formatCurrency(data.vrsaldo)}</span></div>
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      <div className="section-garantia">
        <h3 className="section-title-garantia">OBSERVAÇÕES ADICIONAIS</h3>
        <div className="grid-row-garantia" style={{ minHeight: '60px' }}>
          <div style={{ flex: 1, borderRight: 'none' }}>
            <span className="field-value">{data.obs || 'Nenhuma observação informada.'} {data.obs2 ? ` ${data.obs2}` : ''}</span>
          </div>
        </div>
      </div>

      {/* ASSINATURAS */}
      <div className="signatures-garantia">
        <div className="signature-box">
          <div className="signature-line"></div>
          <span className="field-label">Assinatura do Técnico / Responsável</span>
          <span className="field-value" style={{ fontSize: '6pt' }}>Impressão: {new Date().toLocaleString('pt-BR')}</span>
        </div>
        <div className="signature-box">
          <div className="signature-line"></div>
          <span className="field-label">Assinatura do Cliente / Transportador</span>
        </div>
      </div>

    </div>
  );
};

export default LaudoGarantiaPrintView;
