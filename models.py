from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    vehicles = relationship("Vehicle", back_populates="owner")
    config = relationship("UserConfig", back_populates="user", uselist=False)

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    make = Column(String)
    model = Column(String)
    year = Column(Integer)
    current_km = Column(Integer)
    license_plate = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="vehicles")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    insights = relationship("VehicleInsights", back_populates="vehicle", uselist=False)

class MaintenanceType(Base):
    __tablename__ = "maintenance_types"
    __table_args__ = (UniqueConstraint('name', 'user_id', name='_name_user_uc'),)
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    default_interval_km = Column(Integer) 
    default_interval_months = Column(Integer)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    user = relationship("User")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    maintenance_type_id = Column(Integer, ForeignKey("maintenance_types.id"))
    date_performed = Column(DateTime, default=datetime.utcnow)
    km_performed = Column(Integer)
    notes = Column(String, nullable=True)
    service_cost = Column(Float, default=0.0)
    product_cost = Column(Float, default=0.0)
    category = Column(String, nullable=False, default='preventiva')  # preventiva, desgaste, corretiva
    
    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
    maintenance_type = relationship("MaintenanceType")

class UserConfig(Base):
    __tablename__ = "user_configs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    llm_provider = Column(String, nullable=True) # p. ex. 'openai', 'gemini', 'claude'
    llm_api_key_encrypted = Column(String, nullable=True)
    
    user = relationship("User", back_populates="config")

class VehicleInsights(Base):
    __tablename__ = "vehicle_insights"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), unique=True)
    chronic_issues = Column(String, nullable=True) # armazenaremos como JSON string
    suggested_maintenance = Column(String, nullable=True) # armazenaremos como JSON string
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    vehicle = relationship("Vehicle", back_populates="insights")