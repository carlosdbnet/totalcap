import { Settings, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Configuracoes.css';

export default function Configuracoes() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="config-container">
      <header className="page-header">
        <h1 className="title">Configurações do Sistema</h1>
        <p className="text-muted">Personalize sua experiência no Totalcap</p>
      </header>

      <div className="config-grid">
        {/* SEÇÃO: APARÊNCIA */}
        <div className="config-card glass-panel">
          <h3><Palette size={20} /> Aparência e Tema</h3>
          <p className="description">Escolha o tema que melhor se adapta ao seu ambiente de trabalho.</p>
          
          <div className="theme-options">
            <div 
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <div className="theme-preview preview-dark">
                <div style={{ display: 'flex', gap: '8px', height: '100%' }}>
                  <div className="p-sidebar"></div>
                  <div className="p-content"></div>
                </div>
              </div>
              <div className="theme-label">
                <Moon size={16} />
                <span>Tema Escuro (Premium)</span>
              </div>
            </div>

            <div 
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <div className="theme-preview preview-light">
                <div style={{ display: 'flex', gap: '8px', height: '100%' }}>
                  <div className="p-sidebar"></div>
                  <div className="p-content"></div>
                </div>
              </div>
              <div className="theme-label">
                <Sun size={16} />
                <span>Tema Claro (Profissional)</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO: OUTRAS CONFIGS (Placeholder) */}
        <div className="config-card glass-panel">
          <h3><Settings size={20} /> Preferências de Interface</h3>
          <p className="description">Configurações adicionais de comportamento do sistema.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
              <span>Notificações Sonoras</span>
              <div style={{ width: '40px', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
              <span>Salvar Automaticamente</span>
              <div style={{ width: '40px', height: '20px', background: 'var(--primary)', borderRadius: '10px' }}></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Mais configurações estarão disponíveis em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
