from sqlalchemy import Column, Integer, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=True)
    usage = Column(Integer, nullable=True)
    last_login = Column(Date, nullable=True)
    tickets = Column(Integer, nullable=True)
    backup_status = Column(Text, nullable=True)
    last_backup = Column(Date, nullable=True)

    # Establish relationship to CTA (One-to-Many)
    ctas = relationship("CTA", back_populates="customer", cascade="all, delete-orphan")

    @property
    def health_status(self) -> str:
        if self.backup_status == "Failed":
            return "Critical"
        if (self.usage is not None and self.usage < 40) or (self.tickets is not None and self.tickets > 3):
            return "At Risk"
        return "Healthy"

    @property
    def suggested_action(self) -> str:
        if self.backup_status == "Failed":
            return "Fix Backup Immediately"
        if self.usage is not None and self.usage < 40:
            return "Schedule Training"
        if self.tickets is not None and self.tickets > 3:
            return "Escalate Issue"
        return "No action required"


class CTA(Base):
    __tablename__ = "ctas"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    action = Column(Text, nullable=True)
    priority = Column(Text, nullable=True)
    status = Column(Text, nullable=True)

    # Establish reverse relationship to Customer
    customer = relationship("Customer", back_populates="ctas")

    @property
    def customer_name(self) -> str:
        return self.customer.name if self.customer else "Unknown"
