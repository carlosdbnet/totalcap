import './Dashboard.css';
import { Activity, CircleDollarSign, AlertTriangle, Layers } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Pneus em Produção', value: '142', icon: Layers, color: '#3b82f6' },
    { label: 'Faturamento Mês', value: 'R$ 45.230', icon: CircleDollarSign, color: '#10b981' },
    { label: 'Garantias Abertas', value: '3', icon: AlertTriangle, color: '#ef4444' },
    { label: 'Capacidade Produtiva', value: '78%', icon: Activity, color: '#8b5cf6' },
  ];

  return (
    <div className="dashboard-container">
      <h1 className="title">Dashboard Geral</h1>
      
      <div className="stats-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="dashboard-charts">
        <div className="chart-card glass-panel">
          <h3>Evolução de Produção</h3>
          <div className="chart-placeholder">
            {/* Placeholder para grafico Recharts ou Chart.js */}
            <div className="fake-chart"></div>
          </div>
        </div>
        <div className="chart-card glass-panel">
          <h3>Alertas Recentes</h3>
          <ul className="alert-list">
            <li>Falha na autoclave #2</li>
            <li>Estoque de borracha baixo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
