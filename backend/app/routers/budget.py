from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config import DEFAULT_BUDGET
from ..database import get_db
from ..deps import get_client_id
from ..models import Budget
from ..schemas import BudgetIn, BudgetOut

router = APIRouter(prefix="/api/budget", tags=["budget"])

# Creates the visitor's budget row or updates it if it already exists
def upsert_budget(db: Session, client_id: str, amount: float) -> None:
    budget = db.get(Budget, client_id)
    if budget is None:
        db.add(Budget(client_id=client_id, amount=amount))
    else:
        budget.amount = amount


@router.get("", response_model=BudgetOut)
def get_budget(
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    budget = db.get(Budget, client_id)
    return BudgetOut(amount=budget.amount if budget else DEFAULT_BUDGET)


@router.put("", response_model=BudgetOut)
def update_budget(
    payload: BudgetIn,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    upsert_budget(db, client_id, payload.amount)
    db.commit()
    return BudgetOut(amount=payload.amount)