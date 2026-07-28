import re
from sqlalchemy import text
from sqlalchemy.orm import Session

# ---------------------------------------
# 1) Allowed SQL patterns (whitelist)
# ---------------------------------------

ALLOWED_START = re.compile(r"^\s*(SELECT|WITH)\b", re.IGNORECASE)

# ---------------------------------------
# 2) Forbidden keywords (blacklist)
# ---------------------------------------

FORBIDDEN_KEYWORDS = [
    "DROP", "DELETE", "UPDATE", "INSERT",
    "ALTER", "TRUNCATE", "CREATE", "REPLACE",
    "GRANT", "REVOKE", "COPY",
    "SET ", "RESET ",
    "EXEC", "CALL",
    "pg_catalog", "information_schema"
]


# ---------------------------------------
# Main validation function
# ---------------------------------------

def validate_sql(sql: str, allowed_tables: dict, allowed_columns: dict, db: Session):
    """
    Validate generated SQL before execution.
    
    Params:
        sql: str → SQL to validate
        allowed_tables: list[str] → tables owned by this user
        allowed_columns: dict[table] → list of columns
        db: session for EXPLAIN check

    Returns: cleaned SQL or raises ValueError
    """

    original_sql = sql.strip()

    # ---------------------------------------
    # 1) Must start with SELECT or WITH
    # ---------------------------------------
    if not ALLOWED_START.match(original_sql):
        raise ValueError("SQL must start with SELECT or WITH.")

    # ---------------------------------------
    # 2) Check forbidden keywords
    # ---------------------------------------
    upper_sql = original_sql.upper()
    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in upper_sql:
            raise ValueError(f"SQL contains forbidden keyword: {keyword}")

    # ---------------------------------------
    # 3) Extract table names used in SQL
    # ---------------------------------------

    table_pattern = r"FROM\s+([a-zA-Z0-9_\"\.]+)|JOIN\s+([a-zA-Z0-9_\"\.]+)"
    matches = re.findall(table_pattern, original_sql, flags=re.IGNORECASE)

    used_tables = set()

    for m in matches:
        tbl = m[0] or m[1]
        tbl = tbl.replace('"', "")  # remove quotes
        used_tables.add(tbl)

    # ---------------------------------------
    # 4) Ensure tables exist & belong to user
    # ---------------------------------------
    for tbl in used_tables:
        if tbl not in allowed_tables:
            raise ValueError(f"Table '{tbl}' is not allowed.")

    # ---------------------------------------
    # 5) Ensure columns exist in allowed schema
    # ---------------------------------------

    # naive column detection: words after SELECT or JOIN ON
    column_pattern = r"\b([a-zA-Z_][a-zA-Z0-9_]*)\b"

    sql_tokens = re.findall(column_pattern, original_sql)

    # columns allowed for all user tables
    all_allowed_columns = set()
    for cols in allowed_columns.values():
        all_allowed_columns.update(cols)

    # remove SQL keywords
    sql_keywords = {
        "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "AS",
        "LIMIT", "OFFSET", "ORDER", "BY", "ASC", "DESC",
        "GROUP", "HAVING", "JOIN", "ON", "WITH"
    }

    for token in sql_tokens:
        # ignore SQL keywords
        if token.upper() in sql_keywords:
            continue

        # ignore table names
        if token in allowed_tables:
            continue

        # ignore numeric values
        if token.isnumeric():
            continue

        # column check
        if token not in all_allowed_columns:
            raise ValueError(f"Invalid or unknown column: '{token}'")

    # ---------------------------------------
    # 6) EXPLAIN to validate syntax
    # ---------------------------------------
    try:
        explain_sql = f"EXPLAIN {original_sql}"
        db.execute(text(explain_sql))
    except Exception as e:
        raise ValueError(f"SQL syntax error: {e}")

    # ---------------------------------------
    # 7) Add LIMIT for safety
    # ---------------------------------------
    cleaned = f"SELECT * FROM ({original_sql}) AS safe_query LIMIT 1000;"

    return cleaned
