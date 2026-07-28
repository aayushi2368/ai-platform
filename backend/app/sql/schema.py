from sqlalchemy import text
from sqlalchemy.orm import Session
from app.sql.models import UploadedTable

def get_user_tables(db: Session, user_id: str):
    """
    Returns a list of tables uploaded by this user.
    Each item: { table_name, columns }
    """

    # Query UploadedTable to get only your tables
    user_tables = db.query(UploadedTable).filter(
        UploadedTable.user_id == user_id
    ).all()

    results = []

    for tbl in user_tables:
        table_name = tbl.table_name

        # Query PostgreSQL for column names
        sql = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = :table
            ORDER BY ordinal_position
        """)

        columns = db.execute(sql, {"table": table_name}).fetchall()
        columns = [c[0] for c in columns]

        results.append({
            "table_name": table_name,
            "columns": columns
        })

    return results
