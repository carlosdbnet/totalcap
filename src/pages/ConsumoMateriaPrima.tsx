import { Layers } from 'lucide-react';

export default function ConsumoMateriaPrima() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title-group">
          <Layers className="header-icon" />
          <div>
            <h1>Consumo de Mat.Prima</h1>
            <p>Monitoramento de insumos e matérias-primas utilizadas</p>
          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <h2 style={{ color: '#64748b' }}>Módulo de Consumo em Desenvolvimento</h2>
        <p style={{ color: '#94a3b8' }}>Esta funcionalidade permitirá o controle preciso do estoque de insumos da fábrica.</p>
      </div>
    </div>
  );
}
