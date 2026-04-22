import { Clock } from 'lucide-react';

export default function Apontamento() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title-group">
          <Clock className="header-icon" />
          <div>
            <h1>Apontamento</h1>
            <p>Registro de produção e tempos operacionais</p>
          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <h2 style={{ color: '#64748b' }}>Módulo de Apontamento em Desenvolvimento</h2>
        <p style={{ color: '#94a3b8' }}>Esta funcionalidade estará disponível em breve para controle do chão de fábrica.</p>
      </div>
    </div>
  );
}
