import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Building2, 
  Users, 
  FileText, TrendingUp, Gift, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/cajas', icon: Wallet, label: 'Cajas' },
  { path: '/ventas', icon: Building2, label: 'Ventas' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/certificados', icon: FileText, label: 'Certificados' },
  { path: '/pyl', icon: TrendingUp, label: 'P&L' },
  { path: '/beneficios', icon: Gift, label: 'Beneficios' },
  { path: '/expensas', icon: FileText, label: 'Expensas' },
];

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 glass border-r border-green-200
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-gray-800" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-gray-800">Constructora</h1>
                <p className="text-xs text-gray-800/50">Sistema ERP</p>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-gray-800/70 hover:bg-green-50 hover:text-gray-800'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              </NavLink>
            ))}
          </nav>

          {/* Usuario */}
          <div className="p-4 border-t border-green-200">
            <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-gray-800 font-bold">
                {user?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.nombre}</p>
                <p className="text-xs text-gray-800/50 capitalize">{user?.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-green-100 text-gray-800/60 hover:text-gray-800 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 min-h-screen">
        {/* Header móvil */}
        <header className="lg:hidden glass border-b border-green-200 p-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-800">Constructora ERP</h1>
          </div>
        </header>

        {/* Contenido */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
