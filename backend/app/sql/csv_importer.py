from io import BytesIO, StringIO
import uuid
import pandas as pd
import csv
from sqlalchemy import text
from app.db.connection import engine
import logging

logger = logging.getLogger(__name__)


# ---------- Normalization utilities ----------

def sanitize_column_name(col: str) -> str:
    """
    Convert CSV column names to SQL-safe snake_case:
      - lowercase
      - spaces/dashes/slashes → underscore
      - remove weird symbols
    """
    c = col.strip().lower()
    for ch in [' ', '-', '/', '\\', '.', '$', '%']:
        c = c.replace(ch, '_')
    return c


def quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def make_table_name(prefix: str = "csv") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


# ---------- Type inference ----------

def infer_sql_type(dtype) -> str:
    if pd.api.types.is_integer_dtype(dtype):
        return "INTEGER"
    if pd.api.types.is_float_dtype(dtype):
        return "DOUBLE PRECISION"
    if pd.api.types.is_bool_dtype(dtype):
        return "BOOLEAN"
    if pd.api.types.is_datetime64_any_dtype(dtype):
        return "TIMESTAMP"
    return "TEXT"


# ---------- Read CSV robustly ----------

def read_csv_robust(bytes_data: bytes) -> pd.DataFrame:
    bio = BytesIO(bytes_data)
    try:
        return pd.read_csv(bio)
    except Exception:
        bio.seek(0)
        return pd.read_csv(bio, encoding="latin-1")


# ---------- Main Import Function (COPY + normalized columns) ----------

def import_csv_to_sqltable_via_copy(file_bytes: bytes):
    """
    Reads CSV → normalizes column names → infers SQL types → CREATE TABLE → COPY data.
    Returns: (table_name, row_count, normalized_columns)
    """

    # 1) Read CSV
    df = read_csv_robust(file_bytes)
    if df.shape[1] == 0:
        raise ValueError("CSV has no columns.")

    # 2) Normalize column names
    original_columns = list(df.columns)
    normalized_columns = [sanitize_column_name(str(c)) for c in original_columns]
    df.columns = normalized_columns

    # 3) Infer SQL types
    sql_columns = []
    for col in df.columns:
        sql_type = infer_sql_type(df[col].dtype)
        sql_columns.append(f"{quote_ident(col)} {sql_type}")

    # 4) Generate table name
    table_name = make_table_name()

    # 5) Build CREATE TABLE
    create_sql = f"CREATE TABLE {quote_ident(table_name)} (\n  " + ",\n  ".join(sql_columns) + "\n);"

    # 6) Prepare CSV in memory (normalized names)
    sio = StringIO()
    writer = csv.writer(sio, lineterminator="\n")
    writer.writerow(df.columns)

    for row in df.itertuples(index=False, name=None):
        writer.writerow(["" if pd.isna(x) else x for x in row])

    sio.seek(0)

    # 7) Execute in transaction - Try COPY first, fallback to INSERT
    with engine.begin() as conn:
        try:
            # Create the table
            conn.execute(text(create_sql))

            # Try using COPY (works with both psycopg2 and psycopg3)
            try:
                raw_conn = conn.connection.dbapi_connection
                
                copy_sql = f"""
                    COPY {quote_ident(table_name)}
                    ({', '.join(quote_ident(c) for c in df.columns)})
                    FROM STDIN WITH (FORMAT CSV, HEADER TRUE)
                """

                # psycopg3 uses copy() instead of copy_expert()
                if hasattr(raw_conn, 'cursor'):
                    with raw_conn.cursor() as cur:
                        if hasattr(cur, 'copy'):
                            # psycopg3 style
                            with cur.copy(copy_sql) as copy:
                                sio.seek(0)
                                for line in sio:
                                    copy.write(line)
                            logger.info(f"Used COPY (psycopg3) for fast import of {len(df)} rows")
                        elif hasattr(cur, 'copy_expert'):
                            # psycopg2 style
                            sio.seek(0)
                            cur.copy_expert(copy_sql, sio)
                            logger.info(f"Used COPY (psycopg2) for fast import of {len(df)} rows")
                        else:
                            raise AttributeError("No COPY method available")
                else:
                    raise AttributeError("No cursor available")
                    
            except (AttributeError, Exception) as copy_error:
                # COPY not available, fallback to batch INSERT
                logger.warning(f"COPY method failed ({copy_error}), using INSERT fallback")
                
                # Batch insert using pandas to_sql
                df.to_sql(
                    table_name,
                    conn,
                    if_exists='append',
                    index=False,
                    method='multi',
                    chunksize=1000
                )
                logger.info(f"Used INSERT for import of {len(df)} rows")

        except Exception as e:
            # Rollback by dropping the table if it was created
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {quote_ident(table_name)};"))
            except:
                pass
            raise Exception(f"Database import error: {str(e)}") from e

    return table_name, int(df.shape[0]), normalized_columns
