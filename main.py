from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.exc import IntegrityError
import os

import models
from database import SessionLocal, engine

# Cria as tabelas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ManutenCar API")

origins = ["*"]

# Configuração de CORS para permitir que o frontend acesse o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar arquivos estáticos
app.mount("/static", StaticFiles(directory="."), name="static")

# Rota de teste
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Configuração de Segurança (Simplificada para o exemplo)
SECRET_KEY = "sua_chave_secreta_super_segura"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependência de Banco de Dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Schemas Pydantic ---
class VehicleCreate(BaseModel):
    make: str
    model: str
    year: int
    current_km: int
    license_plate: str

class VehicleUpdate(BaseModel):
    make: str
    model: str
    year: int
    current_km: int
    license_plate: str

class MaintenanceTypeCreate(BaseModel):
    name: str
    default_interval_km: int
    default_interval_months: int
    description: Optional[str] = None

class MaintenanceLogCreate(BaseModel):
    maintenance_type_id: int
    km_performed: int
    date_performed: datetime
    notes: Optional[str] = None
    service_cost: float = 0.0
    product_cost: float = 0.0
    category: str = 'preventiva'

class UserCreate(BaseModel):
    name: Optional[str] = None
    email: str
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class MaintenanceTypeUpdate(BaseModel):
    name: Optional[str] = None
    default_interval_km: Optional[int] = None
    default_interval_months: Optional[int] = None
    description: Optional[str] = None

class MaintenanceLogUpdate(BaseModel):
    maintenance_type_id: Optional[int] = None
    km_performed: Optional[int] = None
    date_performed: Optional[datetime] = None
    notes: Optional[str] = None
    service_cost: Optional[float] = None
    product_cost: Optional[float] = None
    category: Optional[str] = None

# --- Funções Auxiliares ---
def create_access_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
    except JWTError:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user

def send_email_alert(email: str, message: str):
    # Simulação de envio de email
    print(f"--- EMAIL ENVIADO PARA {email} ---\nConteúdo: {message}\n-----------------------------------")

# --- Rotas ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # 1. Verificar se o e-mail já existe
        existing = db.query(models.User).filter(models.User.email == user.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este e-mail já está em uso.")
            
        # 2. Criar novo usuário
        hashed_pw = pwd_context.hash(user.password)
        db_user = models.User(name=user.name, email=user.email, hashed_password=hashed_pw)
        db.add(db_user)
        db.flush() # Obtém o ID sem commitar
        
        # 3. Seed personal maintenance types (na mesma transação)
        defaults = [
            {"name": "Troca de Óleo do Motor", "km": 10000, "months": 12},
            {"name": "Filtro de Óleo", "km": 10000, "months": 12},
            {"name": "Filtro de Ar", "km": 20000, "months": 24},
            {"name": "Filtro de Combustível", "km": 20000, "months": 24},
            {"name": "Pastilhas de Freio", "km": 30000, "months": 36},
            {"name": "Fluido de Freio", "km": 40000, "months": 24},
            {"name": "Líquido de Arrefecimento", "km": 40000, "months": 24},
            {"name": "Óleo de Câmbio (Manual)", "km": 100000, "months": 60},
            {"name": "Correia Dentada", "km": 60000, "months": 48},
            {"name": "Velas de Ignição", "km": 50000, "months": 48},
        ]
        for item in defaults:
            mt = models.MaintenanceType(
                name=item["name"], 
                default_interval_km=item["km"], 
                default_interval_months=item["months"],
                user_id=db_user.id
            )
            db.add(mt)
        
        db.commit()
        return {"msg": "Usuário criado"}
        
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e).lower()
        if "unique" in error_msg and "email" in error_msg:
            raise HTTPException(status_code=400, detail="Este e-mail já está em uso.")
        raise HTTPException(status_code=400, detail=f"Erro de integridade no banco de dados: {e}")
    except Exception as e:
        db.rollback()
        print(f"ERRO NO REGISTRO: {e}")
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro interno: {e}")

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Login incorreto")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me")
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email}

@app.put("/me")
def update_current_user(user_update: UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.email is not None:
        # Check if email is already taken
        existing = db.query(models.User).filter(models.User.email == user_update.email, models.User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este e-mail já está em uso.")
        current_user.email = user_update.email
    if user_update.password is not None:
        current_user.hashed_password = pwd_context.hash(user_update.password)
    db.commit()
    db.refresh(current_user)
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email}

@app.delete("/me")
def delete_current_user(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Deletar todos os dados associados
    # 1. Veículos (que deletarão logs devido à relação)
    vehicles = db.query(models.Vehicle).filter(models.Vehicle.owner_id == current_user.id).all()
    for v in vehicles:
        db.query(models.MaintenanceLog).filter(models.MaintenanceLog.vehicle_id == v.id).delete()
        db.delete(v)
    
    # 2. Tipos de manutenção
    db.query(models.MaintenanceType).filter(models.MaintenanceType.user_id == current_user.id).delete()
    
    # 3. O próprio usuário
    db.delete(current_user)
    db.commit()
    return {"msg": "Conta excluída com sucesso"}

@app.get("/users")
def get_users(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.get("/maintenance-types")
def get_maintenance_types(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.MaintenanceType).filter(models.MaintenanceType.user_id == user.id).order_by(models.MaintenanceType.name).all()

@app.post("/maintenance-types")
def create_maintenance_type(mt: MaintenanceTypeCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.MaintenanceType).filter(
        models.MaintenanceType.name == mt.name,
        models.MaintenanceType.user_id == user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tipo de manutenção já existe para este usuário")
    db_mt = models.MaintenanceType(**mt.dict(), user_id=user.id)
    db.add(db_mt)
    db.commit()
    db.refresh(db_mt)
    return db_mt


@app.put("/maintenance-types/{mt_id}")
def update_maintenance_type(mt_id: int, mt_update: MaintenanceTypeUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_mt = db.query(models.MaintenanceType).filter(
        models.MaintenanceType.id == mt_id,
        models.MaintenanceType.user_id == user.id
    ).first()
    if not db_mt:
        raise HTTPException(status_code=404, detail="Tipo de manutenção não encontrado")
    
    if mt_update.name is not None:
        db_mt.name = mt_update.name
    if mt_update.default_interval_km is not None:
        db_mt.default_interval_km = mt_update.default_interval_km
    if mt_update.default_interval_months is not None:
        db_mt.default_interval_months = mt_update.default_interval_months
    if mt_update.description is not None:
        db_mt.description = mt_update.description
        
    db.commit()
    db.refresh(db_mt)
    return db_mt


@app.delete("/maintenance-types/{mt_id}")
def delete_maintenance_type(mt_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    mt = db.query(models.MaintenanceType).filter(
        models.MaintenanceType.id == mt_id,
        models.MaintenanceType.user_id == user.id
    ).first()
    if not mt:
        raise HTTPException(status_code=404, detail="Tipo de manutenção não encontrado")

    # Verifica se existem logs de manutenção referenciando este tipo
    linked = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.maintenance_type_id == mt_id).first()
    if linked:
        raise HTTPException(status_code=400, detail="Não é possível remover: existem registros de manutenção ligados a este tipo")

    db.delete(mt)
    db.commit()
    return {"msg": "Tipo de manutenção removido"}

@app.post("/vehicles")
def create_vehicle(vehicle: VehicleCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = vehicle.dict()
    data['license_plate'] = data['license_plate'].upper()
    db_vehicle = models.Vehicle(**data, owner_id=user.id)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.put("/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle: VehicleUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id, models.Vehicle.owner_id == user.id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    db_vehicle.make = vehicle.make
    db_vehicle.model = vehicle.model
    db_vehicle.year = vehicle.year
    db_vehicle.current_km = vehicle.current_km
    db_vehicle.license_plate = vehicle.license_plate.upper()
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id, models.Vehicle.owner_id == user.id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    # Deleta logs associados (ou o banco cuidaria se houvesse cascade, mas vamos garantir)
    db.query(models.MaintenanceLog).filter(models.MaintenanceLog.vehicle_id == vehicle_id).delete()
    
    db.delete(db_vehicle)
    db.commit()
    return {"msg": "Veículo removido com sucesso"}

@app.get("/vehicles")
def get_vehicles(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Aqui calculamos o status de alerta para cada veículo
    vehicles = db.query(models.Vehicle).filter(models.Vehicle.owner_id == user.id).all()
    results = []
    
    for v in vehicles:
        alerts = []
        # Verifica cada tipo de manutenção DO USUÁRIO
        m_types = db.query(models.MaintenanceType).filter(models.MaintenanceType.user_id == user.id).all()
        for mt in m_types:
            # Pega a última manutenção deste tipo para este carro
            last_log = db.query(models.MaintenanceLog)\
                .filter(models.MaintenanceLog.vehicle_id == v.id, models.MaintenanceLog.maintenance_type_id == mt.id)\
                .order_by(models.MaintenanceLog.date_performed.desc())\
                .first()
            
            status_msg = "OK"
            is_due = False
            
            if last_log:
                next_km = (last_log.km_performed or 0) + (mt.default_interval_km or 0)
                # Garantir que temos um intervalo de meses válido
                interval_months = mt.default_interval_months if mt.default_interval_months is not None else 12
                next_date = last_log.date_performed + timedelta(days=interval_months * 30)
                
                # Forçar comparação com datetime naive (SQLite armazena sem fuso)
                now = datetime.utcnow()
                if v.current_km >= next_km:
                    is_due = True
                    status_msg = f"Vencido por KM (Próx: {next_km}km)"
                elif now >= next_date:
                    is_due = True
                    status_msg = f"Vencido por Tempo (Próx: {next_date.date()})"
            else:
                # Nunca fez manutenção, considera pendente se o carro já rodou muito?
                # Para simplificar, vamos considerar OK até o primeiro registro ou marcar como "Nunca realizado"
                status_msg = "Nunca registrado"
            
            if is_due:
                alerts.append({"type": mt.name, "msg": status_msg})
        
        # Garantir que total_cost seja calculado de forma segura
        total_cost = 0.0
        for l in v.maintenance_logs:
            s_cost = l.service_cost if l.service_cost is not None else 0.0
            p_cost = l.product_cost if l.product_cost is not None else 0.0
            total_cost += (s_cost + p_cost)

        results.append({
            "id": v.id,
            "make": v.make,
            "model": v.model,
            "current_km": v.current_km,
            "license_plate": v.license_plate,
            "total_maintenance_cost": total_cost,
            "alerts": alerts
        })
    return results

@app.post("/vehicles/{vehicle_id}/maintenance")
def add_maintenance(
    vehicle_id: int, 
    log: MaintenanceLogCreate, 
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id, models.Vehicle.owner_id == user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    # 1. Atualiza a quilometragem do veículo se a da manutenção for maior
    if log.km_performed > vehicle.current_km:
        vehicle.current_km = log.km_performed
    
    # 2. Registra a manutenção
    db_log = models.MaintenanceLog(**log.dict(), vehicle_id=vehicle_id)
    db.add(db_log)
    db.commit()
    
    # 3. Verifica se precisa enviar email de alerta sobre PRÓXIMAS manutenções (Lógica simplificada)
    # Exemplo: Se trocou óleo agora, avisa quando será a próxima
    mt = db.query(models.MaintenanceType).filter(models.MaintenanceType.id == log.maintenance_type_id).first()
    interval_km = mt.default_interval_km if mt and mt.default_interval_km is not None else 10000
    next_km = log.km_performed + interval_km
    
    msg = f"Manutenção '{mt.name}' registrada para {vehicle.model}. Próxima troca prevista em {next_km}km."
    background_tasks.add_task(send_email_alert, user.email, msg)
    
    return {"msg": "Manutenção registrada e KM atualizada", "next_due_km": next_km}

@app.get("/vehicles/{vehicle_id}/history")
def get_vehicle_history(vehicle_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id, models.Vehicle.owner_id == user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    logs = db.query(models.MaintenanceLog)\
        .filter(models.MaintenanceLog.vehicle_id == vehicle_id)\
        .order_by(models.MaintenanceLog.date_performed.desc())\
        .all()
        
    history = []
    for log in logs:
        m_type_name = log.maintenance_type.name if log.maintenance_type else "Tipo Desconhecido"
        history.append({
            "id": log.id,
            "maintenance_type": m_type_name,
            "date_performed": log.date_performed,
            "km_performed": log.km_performed,
            "notes": log.notes,
            "service_cost": log.service_cost,
            "product_cost": log.product_cost,
            "category": log.category
        })
    return history

@app.put("/maintenance-logs/{log_id}")
def update_maintenance_log(log_id: int, log_update: MaintenanceLogUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verificar se o log pertence a um veículo do usuário
    db_log = db.query(models.MaintenanceLog)\
        .join(models.Vehicle)\
        .filter(models.MaintenanceLog.id == log_id, models.Vehicle.owner_id == user.id)\
        .first()
        
    if not db_log:
        raise HTTPException(status_code=404, detail="Log de manutenção não encontrado")
    
    if log_update.maintenance_type_id is not None:
        db_log.maintenance_type_id = log_update.maintenance_type_id
    if log_update.km_performed is not None:
        db_log.km_performed = log_update.km_performed
        # Se alterou o KM, pode ser necessário atualizar o current_km do veículo
        vehicle = db_log.vehicle
        if db_log.km_performed > vehicle.current_km:
            vehicle.current_km = db_log.km_performed
            
    if log_update.date_performed is not None:
        db_log.date_performed = log_update.date_performed
    if log_update.notes is not None:
        db_log.notes = log_update.notes
    if log_update.service_cost is not None:
        db_log.service_cost = log_update.service_cost
    if log_update.product_cost is not None:
        db_log.product_cost = log_update.product_cost
    if log_update.category is not None:
        db_log.category = log_update.category
        
    db.commit()
    db.refresh(db_log)
    return db_log

@app.delete("/maintenance-logs/{log_id}")
def delete_maintenance_log(log_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_log = db.query(models.MaintenanceLog)\
        .join(models.Vehicle)\
        .filter(models.MaintenanceLog.id == log_id, models.Vehicle.owner_id == user.id)\
        .first()
        
    if not db_log:
        raise HTTPException(status_code=404, detail="Log de manutenção não encontrado")
        
    db.delete(db_log)
    db.commit()
    return {"msg": "Log de manutenção removido"}

@app.get("/stats")
def get_stats(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Busca logs dos últimos 12 meses
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    logs = db.query(models.MaintenanceLog)\
        .join(models.Vehicle)\
        .filter(models.Vehicle.owner_id == user.id)\
        .filter(models.MaintenanceLog.date_performed >= one_year_ago)\
        .all()
        
    monthly_data = {}
    # Inicializa os últimos 12 meses com zero
    for i in range(12):
        d = datetime.utcnow() - timedelta(days=30 * i)
        key = d.strftime("%Y-%m")
        monthly_data[key] = {"month": d.strftime("%m/%Y"), "service_cost": 0, "product_cost": 0, "count": 0, "sort_key": key}
        
    for log in logs:
        if not log.date_performed:
            continue
        key = log.date_performed.strftime("%Y-%m")
        if key in monthly_data:
            s_cost = log.service_cost or 0
            p_cost = log.product_cost or 0
            monthly_data[key]["service_cost"] += s_cost
            monthly_data[key]["product_cost"] += p_cost
            monthly_data[key]["count"] += 1
            
    return sorted(monthly_data.values(), key=lambda x: x["sort_key"])