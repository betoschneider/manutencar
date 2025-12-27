from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.exc import IntegrityError

import models
from database import SessionLocal, engine

# Cria as tabelas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ManutenCar API")

origins = [
    "http://localhost:8511",
    "http://127.0.0.1:8511",
]

# Configuração de CORS para permitir que o frontend acesse o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class UserCreate(BaseModel):
    email: str
    password: str

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

# --- Inicialização (Seed) ---
@app.on_event("startup")
def seed_maintenance_types():
    db = SessionLocal()
    if db.query(models.MaintenanceType).count() == 0:
        defaults = [
            {"name": "Troca de Óleo do Motor", "km": 10000, "months": 12},
            {"name": "Filtro de Óleo", "km": 10000, "months": 12},
            {"name": "Filtro de Ar", "km": 20000, "months": 24},
            {"name": "Filtro de Combustível", "km": 20000, "months": 24},
            {"name": "Pastilhas de Freio", "km": 30000, "months": 36}, # Varia muito, mas é uma base
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
                default_interval_months=item["months"]
            )
            db.add(mt)
        db.commit()
    db.close()

# --- Rotas ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        hashed_pw = pwd_context.hash(user.password)
        db_user = models.User(email=user.email, hashed_password=hashed_pw)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return {"msg": "Usuário criado"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Este e-mail já está em uso.")
    except Exception as e:
        db.rollback()
        print(f"ERRO NO REGISTRO: {e}") # Isso mostrará o erro real no terminal
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro interno: {e}")

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Login incorreto")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/maintenance-types")
def get_maintenance_types(db: Session = Depends(get_db)):
    return db.query(models.MaintenanceType).all()

@app.post("/maintenance-types")
def create_maintenance_type(mt: MaintenanceTypeCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.MaintenanceType).filter(models.MaintenanceType.name == mt.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tipo de manutenção já existe")
    db_mt = models.MaintenanceType(**mt.dict())
    db.add(db_mt)
    db.commit()
    db.refresh(db_mt)
    return db_mt

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

@app.get("/vehicles")
def get_vehicles(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Aqui calculamos o status de alerta para cada veículo
    vehicles = db.query(models.Vehicle).filter(models.Vehicle.owner_id == user.id).all()
    results = []
    
    for v in vehicles:
        alerts = []
        # Verifica cada tipo de manutenção
        m_types = db.query(models.MaintenanceType).all()
        for mt in m_types:
            # Pega a última manutenção deste tipo para este carro
            last_log = db.query(models.MaintenanceLog)\
                .filter(models.MaintenanceLog.vehicle_id == v.id, models.MaintenanceLog.maintenance_type_id == mt.id)\
                .order_by(models.MaintenanceLog.date_performed.desc())\
                .first()
            
            status_msg = "OK"
            is_due = False
            
            if last_log:
                next_km = last_log.km_performed + mt.default_interval_km
                next_date = last_log.date_performed + timedelta(days=mt.default_interval_months * 30)
                
                if v.current_km >= next_km:
                    is_due = True
                    status_msg = f"Vencido por KM (Próx: {next_km}km)"
                elif datetime.utcnow() >= next_date:
                    is_due = True
                    status_msg = f"Vencido por Tempo (Próx: {next_date.date()})"
            else:
                # Nunca fez manutenção, considera pendente se o carro já rodou muito?
                # Para simplificar, vamos considerar OK até o primeiro registro ou marcar como "Nunca realizado"
                status_msg = "Nunca registrado"
            
            if is_due:
                alerts.append({"type": mt.name, "msg": status_msg})
        
        total_cost = sum((l.service_cost or 0) + (l.product_cost or 0) for l in v.maintenance_logs)

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
    next_km = log.km_performed + mt.default_interval_km
    
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
        history.append({
            "id": log.id,
            "maintenance_type": log.maintenance_type.name,
            "date_performed": log.date_performed,
            "km_performed": log.km_performed,
            "notes": log.notes,
            "service_cost": log.service_cost,
            "product_cost": log.product_cost
        })
    return history

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
        key = log.date_performed.strftime("%Y-%m")
        if key in monthly_data:
            s_cost = log.service_cost or 0
            p_cost = log.product_cost or 0
            monthly_data[key]["service_cost"] += s_cost
            monthly_data[key]["product_cost"] += p_cost
            monthly_data[key]["count"] += 1
            
    return sorted(monthly_data.values(), key=lambda x: x["sort_key"])