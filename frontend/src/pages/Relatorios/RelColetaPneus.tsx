import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, Loader2, FileText } from 'lucide-react';
import api from '../../lib/api';
import './RelColetaPneus.css';
import LogoDbnet from '../../assets/images/LogoEmpresa.png';

interface MobOS {
  id: number;
  dataos: string;
  vtotal: number;
  status: string;
  numos: string;
  contato?: { nome: string };
  vendedor?: { nome: string };
}

export default function RelColetaPneus() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MobOS[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);

  // Filters from URL
  const searchTerm = searchParams.get('search') || '';
  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';

  useEffect(() => {
    fetchData();
  }, []);

  // Aciona a impressão automática após o carregamento dos dados
  useEffect(() => {
    if (!loading && data.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 800); // Tempo para garantir a renderização e carregamento do logo
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, eRes] = await Promise.all([
        api.get('/coletas/'),
        api.get('/empresas/')
      ]);

      let filtered = cRes.data || [];

      // Aplicar filtros iguais aos da tela principal
      if (searchTerm.trim() !== '') {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter((c: any) => 
          String(c.id).includes(lowerSearch) || 
          (c.contato?.nome || '').toLowerCase().includes(lowerSearch) ||
          (c.vendedor?.nome || '').toLowerCase().includes(lowerSearch) ||
          (c.numos ? String(c.numos) : '').includes(lowerSearch)
        );
      }

      if (startDate) {
        filtered = filtered.filter((c: any) => c.dataos && c.dataos >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter((c: any) => c.dataos && c.dataos <= endDate);
      }

      setData(filtered);
      if (eRes.data && eRes.data.length > 0) {
        setEmpresa(eRes.data[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return data.reduce((acc, curr) => acc + (parseFloat(curr.vtotal as any) || 0), 0);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
        <Loader2 className="spinning" /> Carregando Relatório...
      </div>
    );
  }

  return (
    <div className="relatorio-coleta-container">
      <div className="no-print-toolbar">
        <button className="btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          <Printer size={20} /> Imprimir Agora
        </button>
      </div>

      <div className="report-header-formal">
        <div className="report-logo-section">
          <img src={LogoDbnet} alt="Logo" />
          <div className="company-info">
            <h2>{empresa?.razaosocial || 'TOTALCAP GESTÃO DE PNEUS'}</h2>
            <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        
        <div className="report-title-section">
          <h1>RELATÓRIO DE COLETA DE PNEUS</h1>
        </div>

        <div className="report-filter-info">
          <span><strong>Nome do Relatório:</strong> Listagem Geral de Coletas</span>
          <span><strong>Filtro:</strong> {searchTerm ? `Busca por "${searchTerm}"` : 'GERAL'}</span>
          {(startDate || endDate) && (
            <span><strong>Período:</strong> {startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} até {endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Fim'}</span>
          )}
        </div>
      </div>

      <table className="report-table-formal">
        <thead>
          <tr>
            <th>ID</th>
            <th>Número OS</th>
            <th>Data</th>
            <th>Nome Cliente</th>
            <th style={{ textAlign: 'right' }}>Valor Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum registro encontrado.</td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>{item.numos ? `#${item.numos}` : '---'}</td>
                <td>{item.dataos ? new Date(item.dataos).toLocaleDateString('pt-BR') : '---'}</td>
                <td>{item.contato?.nome || '---'}</td>
                <td style={{ textAlign: 'right' }}>R$ {parseFloat(item.vtotal as any || 0).toFixed(2)}</td>
                <td>{item.status || 'PENDENTE'}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total...:</td>
            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
              R$ {calculateTotal().toFixed(2)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
