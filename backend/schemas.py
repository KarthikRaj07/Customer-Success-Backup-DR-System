from pydantic import BaseModel
from datetime import date
from typing import Optional, List

# CTA schemas
class CTABase(BaseModel):
    action: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    customer_id: Optional[int] = None

class CTACreate(CTABase):
    pass

class CTAUpdate(CTABase):
    pass

class CTA(CTABase):
    id: int

    class Config:
        from_attributes = True


# Customer schemas
class CustomerBase(BaseModel):
    name: Optional[str] = None
    usage: Optional[int] = None
    last_login: Optional[date] = None
    tickets: Optional[int] = None
    backup_status: Optional[str] = None
    last_backup: Optional[date] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    ctas: List[CTA] = []

    class Config:
        from_attributes = True
