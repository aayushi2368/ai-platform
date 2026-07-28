"""
Test script to debug CSV upload functionality
Run this to test CSV import without going through the API
"""

import io
from app.sql.csv_importer import import_csv_to_sqltable_via_copy

# Sample CSV data
sample_csv = """Name,Age,City,Salary
John Doe,30,New York,75000
Jane Smith,25,San Francisco,85000
Bob Johnson,35,Chicago,65000
"""

def test_csv_import():
    """Test CSV import directly"""
    print("=" * 60)
    print("Testing CSV Import Function")
    print("=" * 60)
    
    try:
        # Convert string to bytes
        csv_bytes = sample_csv.encode('utf-8')
        
        print(f"\n1. CSV Data ({len(csv_bytes)} bytes):")
        print(sample_csv)
        
        print("\n2. Attempting import...")
        table_name, row_count, columns = import_csv_to_sqltable_via_copy(csv_bytes)
        
        print("\n✅ SUCCESS!")
        print(f"   Table Name: {table_name}")
        print(f"   Rows Imported: {row_count}")
        print(f"   Columns: {columns}")
        
        # Verify the data was imported
        from app.db.connection import engine
        from sqlalchemy import text
        
        print("\n3. Verifying data in database...")
        with engine.connect() as conn:
            result = conn.execute(text(f'SELECT * FROM "{table_name}"'))
            rows = result.fetchall()
            print(f"   Found {len(rows)} rows in table")
            for row in rows:
                print(f"   {dict(row._mapping)}")
        
        print("\n" + "=" * 60)
        print("Test completed successfully! 🎉")
        print("=" * 60)
        
    except Exception as e:
        print("\n❌ ERROR!")
        print(f"   {type(e).__name__}: {str(e)}")
        import traceback
        print("\nFull Traceback:")
        print(traceback.format_exc())
        print("\n" + "=" * 60)
        print("Debugging Tips:")
        print("=" * 60)
        print("1. Check DATABASE_URL in .env file")
        print("2. Ensure PostgreSQL is running")
        print("3. Verify database connection: psql <DATABASE_URL>")
        print("4. Check psycopg2 installation: pip show psycopg2-binary")
        print("=" * 60)

if __name__ == "__main__":
    test_csv_import()
