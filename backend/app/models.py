import datetime

from sqlalchemy import BigInteger, Date, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base

# One row per expense, client_id keeps each visitor's data separate
class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    client_id: Mapped[str] = mapped_column(String(64), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False))
    category: Mapped[str] = mapped_column(String(30))
    description: Mapped[str] = mapped_column(String(100))
    date: Mapped[datetime.date] = mapped_column(Date, index=True)
    timestamp: Mapped[int] = mapped_column(BigInteger)
    updated_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

# One monthly budget per visitor
class Budget(Base):
    __tablename__ = "budgets"

    client_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False))