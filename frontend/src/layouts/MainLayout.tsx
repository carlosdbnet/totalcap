import { useState, useEffect } from 'react';
import { useLocation, Outlet, NavLink } from 'react-router-dom';
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
  Menu,
  X
} from 'lucide-react';
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
      { 
        label: 'Auxiliares', 
        path: '#', 
        isGroup: true,
        subItems: [
          { label: 'Áreas', path: '/areas' },
          { label: 'Regiões', path: '/regioes' },
          { label: 'Atividades', path: '/atividades' },
          { label: 'Vendedores', path: '/vendedores' },
          { label: 'Transportadoras', path: '/transportadoras' },
          { label: 'Cidades', path: '/cidades' },
          { label: 'Estados', path: '/estados' },
        ]
      },
      { 
        label: 'Produção', 
        path: '#', 
        isGroup: true,
        subItems: [
          { label: 'Medidas', path: '/medidas' },
          { label: 'Desenhos', path: '/desenhos' },
          { label: 'Marcas', path: '/marcas' },
          { label: 'Tipo Recapagem', path: '/tipo-recapagem' },
          { label: 'Serviços', path: '/servicos' },
          { label: 'Setores', path: '/setores' },
          { label: 'Operadores', path: '/operadores' },
        ]
      },
      { label: 'Empresa', path: '/empresas' },
    ]
  },
  { icon: Settings, label: 'Configuração', path: '/configuracoes' },
];

export default function MainLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(['Cadastros']);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fecha o menu mobile quando muda de rota
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const toggleSubMenu = (label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isCollapsed) setIsCollapsed(false);
    setOpenSubMenus(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  return (
    <div className={`layout-container ${isCollapsed ? 'is-collapsed' : ''}`}>
      {isMobileOpen && <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)}></div>}

      <aside className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="logo-icon"></div>
          {!isCollapsed && <h2>Totalcap</h2>}
          {isMobileOpen && (
            <button className="icon-btn" onClick={() => setIsMobileOpen(false)} style={{marginLeft: 'auto'}}>
              <X size={20} />
            </button>
          )}
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
                      {item.subItems?.map((sub) => {
                        if (sub.isGroup) {
                          const isGroupOpen = openSubMenus.includes(sub.label);
                          return (
                            <div key={sub.label} className="menu-group nested">
                              <div 
                                className={`sub-nav-item group-header ${isGroupOpen ? 'open' : ''}`}
                                onClick={(e) => toggleSubMenu(sub.label, e)}
                              >
                                <span>{sub.label}</span>
                                <div className="chevron-toggle">
                                  {isGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                              </div>
                              {isGroupOpen && (
                                <div className="nested-sub-menu">
                                  {sub.subItems?.map((deepSub: any) => (
                                    <NavLink 
                                      key={deepSub.path} 
                                      to={deepSub.path} 
                                      className={({isActive}) => `sub-nav-item ${isActive ? 'active' : ''}`}
                                    >
                                      {deepSub.label}
                                    </NavLink>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <NavLink 
                            key={sub.path} 
                            to={sub.path} 
                            className={({isActive}) => `sub-nav-item ${isActive ? 'active' : ''}`}
                          >
                            {sub.label}
                          </NavLink>
                        );
                      })}
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
            {/* Desktop Toggle */}
            <button className="icon-btn collapse-toggle hide-mobile" onClick={() => setIsCollapsed(!isCollapsed)}>
              <Menu size={20} />
            </button>
            {/* Mobile Toggle (Hamburger) */}
            <button className="icon-btn show-mobile" onClick={() => setIsMobileOpen(true)}>
              <Menu size={24} />
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
