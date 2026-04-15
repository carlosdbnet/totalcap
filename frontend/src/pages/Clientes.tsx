import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../lib/api';
import './Clientes.css';

interface Cliente {
  id: number;
  nome: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  criado_em: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes/');
      setClientes(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clientes-container">
      <div className="page-header">
        <h1 className="title">Cadastro de Clientes</h1>
        <button className="btn-primary">
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar clientes..." />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Carregando dados...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Documento</th>
                <th>Email</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">Nenhum cliente cadastrado.</td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>#{cliente.id}</td>
                    <td>{cliente.nome}</td>
                    <td>{cliente.documento}</td>
                    <td>{cliente.email || '-'}</td>
                    <td>
                      <span className={`status-badge ${cliente.ativo ? 'active' : 'inactive'}`}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit"><Edit2 size={16} /></button>
                        <button className="icon-btn delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
