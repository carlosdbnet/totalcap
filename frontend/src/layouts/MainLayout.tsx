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
  ChevronRight
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
    ]
  },
  { icon: Settings, label: 'Configuração', path: '/config' },
];

export default function MainLayout() {
  const { logout } = useAuth();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(['Cadastros']);

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  return (
    <div className="layout-container">
      <aside className="sidebar glass-panel">
        <div className="brand">
          <div className="logo-icon"></div>
          <h2>Totalcap</h2>
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
          <div className="topbar-search">
            {/* Espaço para busca ou breadcrumbs */}
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
