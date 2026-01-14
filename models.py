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
    vehicles = relationship("Vehicle", back_populates="owner")

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