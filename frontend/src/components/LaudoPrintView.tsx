import React from 'react';
import type { Laudo } from '../types/laudo';
import logoEmpresa from '../assets/images/LogoEmpresa.png';

interface LaudoPrintViewProps {
  data: any;
  medidas: any[];
  desenhos: any[];
  tiporecaps: any[];
  clientes: any[];
  empresas: any[];
  title?: string;
}

const LaudoPrintView: React.FC<LaudoPrintViewProps> = ({ data, medidas, desenhos, tiporecaps, clientes, empresas, title = 'FICHA DE RECLAMAÇÃO' }) => {
  const cliente = clientes.find(c => c.id === data.id_contato) || {};
  const empresa = empresas?.find(e => e.id === data.id_empresa) || empresas?.[0] || {};
  const medida = medidas.find(m => m.id === data.id_medida)?.descricao || '---';
  const desenho = desenhos.find(d => d.id === data.id_desenho)?.descricao || '---';
  const tipoRecap = tiporecaps.find(t => t.id === data.id_recap)?.descricao || '---';

  return (
    <div className="print-only laudo-print-container">
      {/* CABEÇALHO */}
      <div className="print-header-laudo">
        <div className="header-logo">
          <img src={logoEmpresa} alt="Logo Empresa" style={{ maxWidth: '150px', maxHeight: '60px', objectFit: 'contain' }} />
        </div>
        <div className="header-center">
          <h1>{title}</h1>
          <p className="empresa-nome">{empresa.razaosocial || empresa.nome || 'NOME DA EMPRESA NÃO CONFIGURADO'}</p>
          <p className="empresa-info">CNPJ: {empresa.cnpj || '---'} | IE: {empresa.inscestadual || '---'}</p>
          <p className="empresa-info">{empresa.endereco || '---'}{empresa.numcasa ? `, ${empresa.numcasa}` : ''} - Telefone: {empresa.telefone || '---'}</p>
        </div>
        <div className="header-right">
          <div className="laudo-number">Nº {data.numlaudo}</div>
        </div>
      </div>

      {/* DADOS DO CLIENTE */}
      <div className="print-section">
        <h3 className="section-title">DADOS DO CLIENTE</h3>
        <div className="print-grid-2">
          <div><strong>Razão Social:</strong> {cliente.nome || '---'}</div>
          <div><strong>CNPJ:</strong> {cliente.cpfcnpj || '---'}</div>
          <div><strong>Telefone:</strong> {cliente.foneprincipal || '---'}</div>
          <div><strong>Cidade/UF:</strong> {cliente.cidade || '---'} / {cliente.uf || '--'}</div>
          <div className="span-2"><strong>Email:</strong> {cliente.email || '---'}</div>
        </div>
      </div>

      {/* DADOS DA OS / NF */}
      <div className="print-section">
        <div className="print-grid-3">
          <div><strong>Nº Ordem Serviço:</strong> {data.numos}</div>
          <div><strong>Nº Nota Fiscal:</strong> {data.numnota || '---'}</div>
          <div><strong>Data NF:</strong> {data.datafat ? new Date(data.datafat).toLocaleDateString() : '---'}</div>
        </div>
      </div>

      {/* ESPECIFICAÇÕES DO PNEU */}
      <div className="print-section">
        <h3 className="section-title">ESPECIFICAÇÕES DO PNEU</h3>
        <table className="print-table">
          <thead>
            <tr>
              <th>Medida</th>
              <th>Marca</th>
              <th>Nº Série</th>
              <th>Nº Fogo</th>
              <th>DOT</th>
              <th>Desenho</th>
              <th>Tipo Recap.</th>
              <th>Vlr. Serviço</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{medida}</td>
              <td>{data.marca || '---'}</td>
              <td>{data.numserie || '---'}</td>
              <td>{data.numfogo || '---'}</td>
              <td>{data.dot || '---'}</td>
              <td>{desenho}</td>
              <td>{tipoRecap}</td>
              <td>R$ {parseFloat(data.vrservico || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* RECLAMAÇÃO E ANÁLISE */}
      <div className="print-section">
        <div className="print-grid-1">
          <div><strong>Defeito Reclamado (Alegação):</strong> {data.alegacao || '---'}</div>
        </div>
      </div>

      <div className="print-section">
        <h3 className="section-title">ANÁLISE TÉCNICA</h3>
        <div className="print-grid-2">
          <div className="approval-boxes">
            <strong>Status:</strong> [ {data.status === 'A' ? 'X' : ' '} ] APROVADO | [ {data.status === 'C' ? 'X' : ' '} ] NÃO APROVADO
          </div>
          <div><strong>Valor Crédito:</strong> R$ {parseFloat(data.vrcredito || 0).toFixed(2)}</div>
          <div><strong>% Reposição:</strong> {data.percrepo || 0}%</div>
          <div><strong>% Reforma:</strong> {data.percrefor || 0}%</div>
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      <div className="print-section">
        <h3 className="section-title">OBSERVAÇÕES TÉCNICAS</h3>
        <div className="obs-box">
          {data.obs || 'Sem observações.'}
          {data.obs2 && <><br />{data.obs2}</>}
        </div>
      </div>

      {/* ASSINATURAS */}
      <div className="print-footer-signatures">
        <div className="signature-line">
          <div className="line"></div>
          <p>Assinatura do Técnico</p>
        </div>
        <div className="signature-line">
          <div className="line"></div>
          <p>Assinatura do Cliente</p>
        </div>
      </div>
    </div>
  );
};

export default LaudoPrintView;
