import sqlite3
import os

def fix_database():
    db_file = 'manutencar.db'
    if not os.path.exists(db_file):
        print(f"Arquivo {db_file} não encontrado.")
        return

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    print("Iniciando correção do banco de dados...")

    try:
        # 1. Criar uma tabela temporária com o schema correto (sem a restrição UNIQUE no name)
        cursor.execute("""
            CREATE TABLE maintenance_types_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR,
                default_interval_km INTEGER,
                default_interval_months INTEGER,
                description VARCHAR,
                user_id INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)

        # 2. Copiar os dados da tabela antiga para a nova
        cursor.execute("""
            INSERT INTO maintenance_types_new (id, name, default_interval_km, default_interval_months, description, user_id)
            SELECT id, name, default_interval_km, default_interval_months, description, user_id FROM maintenance_types
        """)

        # 3. Remover a tabela antiga
        cursor.execute("DROP TABLE maintenance_types")

        # 4. Renomear a nova tabela para o nome original
        cursor.execute("ALTER TABLE maintenance_types_new RENAME TO maintenance_types")

        # 5. Criar índices recomendados (opcional, mas bom para performance)
        cursor.execute("CREATE INDEX ix_maintenance_types_id ON maintenance_types (id)")
        cursor.execute("CREATE INDEX ix_maintenance_types_user_id ON maintenance_types (user_id)")

        conn.commit()
        print("✅ Banco de dados corrigido com sucesso!")
    except Exception as e:
        conn.rollback()
        print(f"❌ Erro ao corrigir banco de dados: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database()
