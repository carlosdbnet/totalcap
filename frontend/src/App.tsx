import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Areas from './pages/Areas';
import Regioes from './pages/Regioes';
import Atividades from './pages/Atividades';
import Vendedores from './pages/Vendedores';
import Transportadora from './pages/Transportadora';
import Cidades from './pages/Cidades';
import Estados from './pages/Estados';
import Medidas from './pages/Medidas';
import Desenhos from './pages/Desenhos';
import Marcas from './pages/Marcas';
import TipoRecapagem from './pages/TipoRecapagem';
import Servicos from './pages/Servicos';
import Setores from './pages/Setores';
import Operadores from './pages/Operadores';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Carregando...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="areas" element={<Areas />} />
            <Route path="regioes" element={<Regioes />} />
            <Route path="atividades" element={<Atividades />} />
            <Route path="vendedores" element={<Vendedores />} />
            <Route path="transportadoras" element={<Transportadora />} />
            <Route path="cidades" element={<Cidades />} />
            <Route path="estados" element={<Estados />} />
            <Route path="medidas" element={<Medidas />} />
            <Route path="desenhos" element={<Desenhos />} />
            <Route path="marcas" element={<Marcas />} />
            <Route path="tipo-recapagem" element={<TipoRecapagem />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="setores" element={<Setores />} />
            <Route path="operadores" element={<Operadores />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
