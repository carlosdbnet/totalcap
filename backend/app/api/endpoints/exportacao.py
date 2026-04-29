from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from backend.database import get_db
import csv
import io
from fastapi.responses import StreamingResponse
from datetime import datetime

router = APIRouter()

@router.get("/dinamica/{table_name}")
def exportar_tabela_dinamica(
    table_name: str,
    db: Session = Depends(get_db),
    format: str = Query("csv", pattern="^(csv|json)$")
) -> Any:
    """
    Exporta todos os campos de uma tabela qualquer informando apenas o nome.
    """
    # Lista de tabelas proibidas por segurança
    TABELAS_PROIBIDAS = ["user", "usuario", "config", "credencial_secreta"]
    
    if table_name.lower() in TABELAS_PROIBIDAS:
        raise HTTPException(status_code=403, detail="Acesso negado a esta tabela por motivos de segurança.")

    try:
        # Verifica se a tabela existe
        inspector = inspect(db.bind)
        if table_name not in inspector.get_table_names():
            raise HTTPException(status_code=404, detail=f"Tabela '{table_name}' não encontrada no banco de dados.")

        # Executa a query
        result = db.execute(text(f"SELECT * FROM {table_name}"))
        columns = result.keys()
        rows = result.all()

        if format == "json":
            data = [dict(zip(columns, row)) for row in rows]
            return data
        
        # Gerar CSV
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        writer.writerow(columns)
        for row in rows:
            writer.writerow(row)
        
        output.seek(0)
        
        filename = f"export_{table_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erro ao exportar tabela: {str(e)}")
