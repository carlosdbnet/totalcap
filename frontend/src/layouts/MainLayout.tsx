import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText,
  BarChart2,
  LogOut,
  MapPin,
  Monitor,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ClipboardList, label: 'Coleta de Pneus', path: '/coleta' },
  { icon: FileText, label: 'Ordem de Serviço', path: '/os' },
  { icon: Monitor, label: 'Produção', path: '/producao' },
  { icon: MapPin, label: 'Localização', path: '/localizacao' },
  { icon: BarChart2, label: 'Relatórios', path: '/relatorios' },
  { 
    icon: Users, 
    label: 'Cadastros', 
    path: '#',
    subItems: [
      { label: 'Clientes', path: '/clientes' },
      { label: 'Áreas', path: '/areas' },
      { label: 'Regiões', path: '/regioes' },
      { label: 'Atividades', path: '/atividades' },
      { label: 'Vendedores', path: '/vendedores' },
      { label: 'Transportadoras', path: '/transportadoras' },
      { label: 'Cidades', path: '/cidades' },
      { label: 'Estados', path: '/estados' },
      { label: 'Medidas', path: '/medidas' },
      { label: 'Desenhos', path: '/desenhos' },
      { label: 'Marcas', path: '/marcas' },
      { label: 'Tipo Recapagem', path: '/tipo-recapagem' },
      { label: 'Serviços', path: '/servicos' },
      { label: 'Setores', path: '/setores' },
      { label: 'Operadores', path: '/operadores' },
    ]
  },
  { icon: Settings, label: 'Configuração', path: '/configuracoes' },
];

export default function MainLayout() {
  const { logout } = useAuth();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(['Cadastros']);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSubMenu = (label: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenSubMenus(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  return (
    <div className={`layout-container ${isCollapsed ? 'is-collapsed' : ''}`}>
      <aside className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="logo-icon"></div>
          {!isCollapsed && <h2>Totalcap</h2>}
        </div>
        
        <nav className="nav-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openSubMenus.includes(item.label);

            if (hasSubItems) {
              return (
                <div key={item.label} className="menu-group">
                  <div 
                    className={`nav-item ${isOpen ? 'group-open' : ''}`} 
                    onClick={() => toggleSubMenu(item.label)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    <div className="chevron-toggle">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                  
                  {isOpen && (
                    <div className="sub-menu">
                      {item.subItems?.map((sub) => (
                        <NavLink 
                          key={sub.path} 
                          to={sub.path} 
                          className={({isActive}) => `sub-nav-item ${isActive ? 'active' : ''}`}
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar glass-panel">
          <div className="topbar-left">
            <button className="icon-btn collapse-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
              <Menu size={20} />
            </button>
            <div className="topbar-search">
              {/* Espaço para busca ou breadcrumbs */}
            </div>
          </div>
          <div className="topbar-actions">
            <div className="user-profile">
              <div className="avatar">AD</div>
              <span>Admin</span>
            </div>
          </div>
        </header>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
