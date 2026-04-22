import { AlertTriangle } from 'lucide-react';

export default function RegistroFalhas() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title-group">
          <AlertTriangle className="header-icon" />
          <div>
            <h1>Registro de Falhas</h1>
            <p>Controle de interrupções e problemas técnicos</p>
          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <h2 style={{ color: '#64748b' }}>Módulo de Registro de Falhas em Desenvolvimento</h2>
        <p style={{ color: '#94a3b8' }}>Esta funcionalidade permitirá catalogar e analisar paradas de produção.</p>
      </div>
    </div>
  );
}
