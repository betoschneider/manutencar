import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# DATABASE_URL deve ser configurada via ambiente. Em produção (Docker),
# defina DATABASE_URL=sqlite:///./manutencar.db.
# Em desenvolvimento local, se não definir, assume o banco na raiz do backend/.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./manutencar.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()