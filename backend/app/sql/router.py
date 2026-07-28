from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.connection import get_db
from app.auth.deps import get_current_user
from app.sql.csv_importer import import_csv_to_sqltable_via_copy
from app.sql.models import UploadedTable
from app.sql.schema import get_user_tables
from app.sql.sql_validator import validate_sql
from app.sql.schema import get_user_tables
from sqlalchemy import text
import logging
import traceback

logger = logging.getLogger(__name__)


sql_router = APIRouter(prefix="/sql", tags=["sql"])

@sql_router.post("/upload_csv")
def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    # Basic guard: size & type (optional for MVP)
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file")

    file_bytes = file.file.read()

    try:
        table_name, row_count, columns = import_csv_to_sqltable_via_copy(file_bytes)
    except ValueError as ve:
        logger.error(f"CSV validation error: {ve}")
        raise HTTPException(400, f"CSV error: {ve}") from ve
    except Exception as e:
        logger.error(f"CSV import failed: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Failed to import CSV into database: {str(e)}") from e

    # Save ownership (so later we can filter schema by user)
    record = UploadedTable(user_id=user.id, table_name=table_name)
    db.add(record)
    db.commit()

    return {
        "table_name": table_name,
        "rows": row_count,
        "columns": columns
    }



@sql_router.get("/schema")
def get_schema(db: Session = Depends(get_db), user = Depends(get_current_user)):
    tables = get_user_tables(db, user.id)
    return { "tables": tables }

@sql_router.post("/execute")
def execute_sql(payload: dict, 
                db: Session = Depends(get_db), 
                user = Depends(get_current_user)):

    sql = payload.get("sql")
    if not sql:
        raise HTTPException(400, "SQL is required.")

    # Step 1: Get user's allowed tables
    schema = get_user_tables(db, user.id)

    allowed_tables = {t["table_name"] for t in schema}
    allowed_columns = {
        t["table_name"]: t["columns"] for t in schema
    }

    # Step 2: Validate SQL
    try:
        cleaned_sql = validate_sql(sql, allowed_tables, allowed_columns, db)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Step 3: Execute SQL
    try:
        rows = db.execute(text(cleaned_sql)).fetchall()
        
        columns = list(rows[0]._mapping.keys()) if rows else []
        results = [dict(r._mapping) for r in rows]

        return {
            "sql": cleaned_sql,
            "columns": columns,
            "rows": results
        }
    except Exception as e:
        logger.error(f"SQL execution error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"SQL execution failed: {str(e)}") from e

@sql_router.get("/test")
def test():
    return {"msg": "sql agent works"}
