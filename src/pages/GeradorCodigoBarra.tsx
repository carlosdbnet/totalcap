import React, { useState, useRef, useEffect } from 'react';
import { Barcode, Printer, Plus, Trash2, Save, Download, FileText, Hash, LayoutGrid } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import './GeradorCodigoBarra.css';

interface LabelRow {
  id: string;
  codigo1: string;
  titulo1: string;
  codigo2: string;
  titulo2: string;
  codigo3: string;
  titulo3: string;
}

const GeradorCodigoBarra: React.FC = () => {
  const [rows, setRows] = useState<LabelRow[]>([
    { id: '1', codigo1: '', titulo1: '', codigo2: '', titulo2: '', codigo3: '', titulo3: '' }
  ]);
  const printRef = useRef<HTMLDivElement>(null);

  const addRow = () => {
    const newRow: LabelRow = {
      id: Math.random().toString(36).substr(2, 9),
      codigo1: '',
      titulo1: '',
      codigo2: '',
      titulo2: '',
      codigo3: '',
      titulo3: ''
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateCell = (id: string, field: keyof LabelRow, value: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handlePrint = () => {
    document.body.classList.add('printing-labels-active');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-labels-active');
    }, 500);
  };

  // Efeito para gerar os códigos de barra após renderizar
  useEffect(() => {
    rows.forEach(row => {
      if (row.codigo1) generateBarcode(`barcode-1-${row.id}`, row.codigo1);
      if (row.codigo2) generateBarcode(`barcode-2-${row.id}`, row.codigo2);
      if (row.codigo3) generateBarcode(`barcode-3-${row.id}`, row.codigo3);
    });
  }, [rows]);

  const generateBarcode = (id: string, value: string) => {
    try {
      const element = document.getElementById(id);
      if (element) {
        JsBarcode(`#${id}`, value, {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 5
        });
      }
    } catch (err) {
      console.error("Erro ao gerar código de barras", err);
    }
  };

  return (
    <div className="gerador-container animate-fade-in">
      <div className="page-header">
        <div className="header-title">
          <Barcode size={28} className="header-icon" />
          <div>
            <h1>Gerador de Etiquetas</h1>
            <p>Crie e imprima etiquetas com códigos de barra em lote.</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={addRow}>
            <Plus size={18} /> Adicionar Linha
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Imprimir Etiquetas
          </button>
        </div>
      </div>

      <div className="glass-panel grid-section">
        <div className="table-responsive">
          <table className="editable-grid">
            <thead>
              <tr>
                <th colSpan={2} className="group-header color-1">Conjunto 1</th>
                <th colSpan={2} className="group-header color-2">Conjunto 2</th>
                <th colSpan={2} className="group-header color-3">Conjunto 3</th>
                <th rowSpan={2} style={{ width: '60px' }}></th>
              </tr>
              <tr>
                <th style={{ width: '150px' }}>Código</th>
                <th>Título</th>
                <th style={{ width: '150px' }}>Código</th>
                <th>Título</th>
                <th style={{ width: '150px' }}>Código</th>
                <th>Título</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="cell-input">
                    <input 
                      type="text" 
                      value={row.codigo1} 
                      onChange={(e) => updateCell(row.id, 'codigo1', e.target.value)}
                      placeholder="Cod. 1"
                    />
                  </td>
                  <td className="cell-input">
                    <input 
                      type="text" 
                      value={row.titulo1} 
                      onChange={(e) => updateCell(row.id, 'titulo1', e.target.value)}
                      placeholder="Título 1"
                    />
                  </td>
                  <td className="cell-input">
                    <input 
                      type="text" 
                      value={row.codigo2} 
                      onChange={(e) => updateCell(row.id, 'codigo2', e.target.value)}
                      placeholder="Cod. 2"
                    />
                  </td>
                  <td className="cell-input">
                    <input 
                      type="text" 
                      value={row.titulo2} 
                      onChange={(e) => updateCell(row.id, 'titulo2', e.target.value)}
                      placeholder="Título 2"
                    />
                  </td>
                  <td className="cell-input">
                    <input 
                      type="text" 
                      value={row.codigo3} 
                      onChange={(e) => updateCell(row.id, 'codigo3', e.target.value)}
                      placeholder="Cod. 3"
                    />
                  </td>
                  <td className="cell-input">
                    <input 
                      type="text" 
                      value={row.titulo3} 
                      onChange={(e) => updateCell(row.id, 'titulo3', e.target.value)}
                      placeholder="Título 3"
                    />
                  </td>
                  <td className="cell-actions">
                    <button className="icon-btn delete" onClick={() => removeRow(row.id)} title="Remover linha">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Área de Visualização para Impressão (Oculta na tela, visível no print) */}
      <div id="print-area" className="print-only">
        <div className="labels-page">
          {rows.map(row => (
            <React.Fragment key={row.id}>
              {row.codigo1 && (
                <div className="label-item">
                  <div className="label-title">{row.titulo1}</div>
                  <svg id={`barcode-1-${row.id}`}></svg>
                </div>
              )}
              {row.codigo2 && (
                <div className="label-item">
                  <div className="label-title">{row.titulo2}</div>
                  <svg id={`barcode-2-${row.id}`}></svg>
                </div>
              )}
              {row.codigo3 && (
                <div className="label-item">
                  <div className="label-title">{row.titulo3}</div>
                  <svg id={`barcode-3-${row.id}`}></svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeradorCodigoBarra;
