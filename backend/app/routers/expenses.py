import datetime
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_client_id
from ..models import Expense
from ..schemas import ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


def _now_ms() -> int:
    return int(time.time() * 1000)


def _get_owned_expense(db: Session, expense_id: str, client_id: str) -> Expense:
    expense = db.get(Expense, expense_id)
    # Same 404 whether the expense is missing or belongs to another visitor
    if expense is None or expense.client_id != client_id:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

# Creates an expense with a generated ID and creation timestamp
@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12, description="Month number, 1-12"),
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    if (year is None) != (month is None):
        raise HTTPException(status_code=400, detail="Provide both year and month, or neither")

    stmt = select(Expense).where(Expense.client_id == client_id)
    if year is not None and month is not None:
        start = datetime.date(year, month, 1)
        end = datetime.date(year + 1, 1, 1) if month == 12 else datetime.date(year, month + 1, 1)
        stmt = stmt.where(Expense.date >= start, Expense.date < end)
    stmt = stmt.order_by(Expense.date.desc(), Expense.timestamp.desc())
    return db.scalars(stmt).all()


@router.post("", response_model=ExpenseOut, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    expense = Expense(
        id=f"exp_{uuid.uuid4().hex}",
        client_id=client_id,
        amount=payload.amount,
        category=payload.category,
        description=payload.description,
        date=payload.date,
        timestamp=_now_ms(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/{expense_id}", response_model=ExpenseOut)
# Replaces an expense's fields and records when it was updated
def update_expense(
    expense_id: str,
    payload: ExpenseCreate,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    expense = _get_owned_expense(db, expense_id, client_id)
    expense.amount = payload.amount
    expense.category = payload.category
    expense.description = payload.description
    expense.date = payload.date
    expense.updated_at = _now_ms()
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
# Deletes expense
def delete_expense(
    expense_id: str,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    expense = _get_owned_expense(db, expense_id, client_id)
    db.delete(expense)
    db.commit()