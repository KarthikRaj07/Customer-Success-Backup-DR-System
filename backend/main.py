from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

# Create database tables in case they don't exist yet (Safe to run; won't overwrite existing tables)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Success Backup & DR System API",
    description="Backend API for managing customers, backup health, and related CTA actions.",
    version="1.0.0"
)

# Enable CORS for frontend web app integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Customer Success Backup & DR System API!",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

# ==========================================
# CUSTOMER ENDPOINTS
# ==========================================

@app.get("/customers", response_model=List[schemas.Customer])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all customers."""
    return db.query(models.Customer).offset(skip).limit(limit).all()

@app.get("/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Retrieve a customer by ID."""
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@app.post("/customers", response_model=schemas.Customer, status_code=201)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer record."""
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.put("/customers/{customer_id}", response_model=schemas.Customer)
def update_customer(customer_id: int, customer: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    """Update an existing customer."""
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update only fields that were sent in the request
    update_data = customer.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer record."""
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(db_customer)
    db.commit()
    return {"message": f"Customer {customer_id} successfully deleted"}


# ==========================================
# CTA (CALL TO ACTIONS) ENDPOINTS
# ==========================================

@app.get("/ctas", response_model=List[schemas.CTA])
def get_ctas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all Call to Action (CTA) items."""
    return db.query(models.CTA).offset(skip).limit(limit).all()

@app.get("/ctas/{cta_id}", response_model=schemas.CTA)
def get_cta(cta_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific CTA by ID."""
    db_cta = db.query(models.CTA).filter(models.CTA.id == cta_id).first()
    if not db_cta:
        raise HTTPException(status_code=404, detail="CTA not found")
    return db_cta

@app.post("/ctas", response_model=schemas.CTA, status_code=201)
def create_cta(cta: schemas.CTACreate, db: Session = Depends(get_db)):
    """Create a new Call to Action."""
    # Optional: Verify if the customer exists before creating a CTA
    if cta.customer_id is not None:
        db_customer = db.query(models.Customer).filter(models.Customer.id == cta.customer_id).first()
        if not db_customer:
            raise HTTPException(status_code=400, detail="Invalid customer_id: Customer does not exist")
            
    db_cta = models.CTA(**cta.model_dump())
    db.add(db_cta)
    db.commit()
    db.refresh(db_cta)
    return db_cta

@app.put("/ctas/{cta_id}", response_model=schemas.CTA)
def update_cta(cta_id: int, cta: schemas.CTAUpdate, db: Session = Depends(get_db)):
    """Update a specific CTA."""
    db_cta = db.query(models.CTA).filter(models.CTA.id == cta_id).first()
    if not db_cta:
        raise HTTPException(status_code=404, detail="CTA not found")
    
    # Optional: Verify customer_id if provided
    if cta.customer_id is not None:
        db_customer = db.query(models.Customer).filter(models.Customer.id == cta.customer_id).first()
        if not db_customer:
            raise HTTPException(status_code=400, detail="Invalid customer_id: Customer does not exist")

    update_data = cta.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cta, key, value)
        
    db.commit()
    db.refresh(db_cta)
    return db_cta

@app.delete("/ctas/{cta_id}")
def delete_cta(cta_id: int, db: Session = Depends(get_db)):
    """Delete a CTA."""
    db_cta = db.query(models.CTA).filter(models.CTA.id == cta_id).first()
    if not db_cta:
        raise HTTPException(status_code=404, detail="CTA not found")
    db.delete(db_cta)
    db.commit()
    return {"message": f"CTA {cta_id} successfully deleted"}
