import { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Palette, Lock, Key, AlertCircle, CheckCircle2, Smartphone, Check, X, Search, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import './Configuracoes.css';

export default function Configuracoes() {
  const { theme, setTheme } = useTheme();

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 4 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/usuarios/me/password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Erro ao alterar senha. Verifique a senha atual.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="config-container">
      <header className="page-header">
        <h1 className="title">Configurações do Sistema</h1>
        <p className="text-muted">Personalize sua experiência e gerencie sua conta no Totalcap</p>
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

        {/* SEÇÃO: SEGURANÇA (ALTERAR SENHA) */}
        <div className="config-card glass-panel">
          <h3><Lock size={20} /> Segurança da Conta</h3>
          <p className="description">Mantenha seu acesso seguro alterando sua senha periodicamente.</p>

          <form className="password-form" onSubmit={handlePasswordChange}>
            {message.text && (
              <div className={`message-banner ${message.type}`}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            <div className="config-input-group">
              <label>Senha Atual</label>
              <div className="input-with-icon">
                <Key size={16} />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  required
                />
              </div>
            </div>

            <div className="config-input-group">
              <label>Nova Senha</label>
              <div className="input-with-icon">
                <Lock size={16} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  required
                />
              </div>
            </div>

            <div className="config-input-group">
              <label>Confirmar Nova Senha</label>
              <div className="input-with-icon">
                <Lock size={16} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>

        {/* SEÇÃO: PREFERÊNCIAS */}
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
          </div>
        </div>

        {/* SEÇÃO: CREDENCIAMENTO DE CELULARES */}
        <DispositivosPanel />
      </div>
    </div>
  );
}

function DispositivosPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDispositivos();
  }, []);

  const fetchDispositivos = async (idToSelect?: string) => {
    const term = idToSelect || searchTerm;
    setLoading(true);
    try {
      const url = term.trim() ? `/dispositivos/?q=${term}` : '/dispositivos/';
      const res = await api.get(url);
      setDispositivos(res.data);
    } catch (err) {
      console.error("Erro ao buscar dispositivos:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutorizacao = async (id: number, currentStatus: boolean) => {
    try {
      const res = await api.put(`/dispositivos/${id}`, { autorizado: !currentStatus });
      setDispositivos(prev => prev.map(d => d.id === id ? res.data : d));
    } catch (err) {
      console.error("Erro ao atualizar autorização:", err);
    }
  };

  const handleAddManual = async () => {
    if (!searchTerm.trim()) return;
    try {
      const res = await api.post('/dispositivos/registrar', {
        android_id: searchTerm,
        modelo: 'Cadastro Manual'
      });
      setDispositivos([res.data]);
      setSearchTerm('');
      setSearchDone(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao cadastrar dispositivo.");
    }
  };

  return (
    <div className="config-card glass-panel span-2-config">
      <h3><Smartphone size={20} /> Credenciamento de Celulares (Mobcap)</h3>
      <p className="description">Localize dispositivos por Android ID e gerencie as permissões de acesso.</p>

      <div className="search-container-config">
        <div className="input-with-icon-container">
          <div className="input-with-icon">
            <Search size={16} />
            <input
              type="text"
              placeholder="Digite as iniciais do Android ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDispositivos()}
            />
          </div>
        </div>
        <button className="btn-secondary" onClick={() => fetchDispositivos()} disabled={loading}>
          {loading ? 'Buscando...' : 'Localizar'}
        </button>
      </div>

      <div className="dispositivos-list">
        {dispositivos.length === 0 ? (
          <div className="empty-state-config">
            {searchTerm.trim()
              ? `Nenhum dispositivo encontrado para "${searchTerm}".`
              : "Nenhum dispositivo cadastrado na tabela credencial."
            }
          </div>
        ) : (
          <div className="dispositivos-table-container">
            <table className="dispositivos-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Sel.</th>
                  <th>Android ID</th>
                  <th>Setor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {dispositivos.map(d => (
                  <tr key={d.id} className={d.autorizado ? 'row-authorized' : 'row-pending'}>
                    <td>
                      <input type="checkbox" style={{ cursor: 'pointer' }} />
                    </td>
                    <td className="font-mono">{d.android_id}</td>
                    <td>{d.setor?.descricao || 'Não atribuído'}</td>
                    <td>
                      <span className={`status-badge ${d.autorizado ? 'active' : 'inactive'}`}>
                        {d.autorizado ? 'Autorizado' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {d.autorizado ? (
                        <button className="btn-table deauthorize" onClick={() => toggleAutorizacao(d.id, d.autorizado)}>
                          <X size={14} /> Desautorizar
                        </button>
                      ) : (
                        <button className="btn-table authorize" onClick={() => toggleAutorizacao(d.id, d.autorizado)}>
                          <Check size={14} /> Autorizar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
