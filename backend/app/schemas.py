import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .config import CATEGORY_IDS


class ExpenseBase(BaseModel):
    amount: float = Field(gt=0, le=1_000_000_000)
    category: str
    description: str = Field(min_length=1, max_length=100)
    date: datetime.date

    @field_validator("amount")
    @classmethod
    def round_amount(cls, value: float) -> float:
        value = round(value, 2)
        if value <= 0:
            raise ValueError("Amount must be greater than zero")
        return value

    @field_validator("category")
    @classmethod
    def category_must_exist(cls, value: str) -> str:
        if value not in CATEGORY_IDS:
            raise ValueError("Unknown category")
        return value

    @field_validator("description")
    @classmethod
    def description_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Description is required")
        return value


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    amount: float
    category: str
    description: str
    date: datetime.date
    timestamp: int
    updated_at: Optional[int] = Field(default=None, serialization_alias="updatedAt")


class BudgetIn(BaseModel):
    amount: float = Field(gt=0, le=1_000_000_000)


class BudgetOut(BaseModel):
    amount: float


class ExpenseImport(ExpenseBase):
    timestamp: Optional[int] = None


class BackupImport(BaseModel):
    expenses: list[ExpenseImport] = Field(default_factory=list, max_length=5000)
    budget: Optional[float] = Field(default=None, gt=0, le=1_000_000_000)


class BackupOut(BaseModel):
    expenses: list[ExpenseOut]
    budget: float
    exportDate: str