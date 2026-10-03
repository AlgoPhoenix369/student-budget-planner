import datetime
import time
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..config import DEFAULT_BUDGET
from ..database import get_db
from ..deps import get_client_id
from ..models import Budget, Expense
from ..schemas import BackupImport, BackupOut, ExpenseOut
from .budget import upsert_budget

router = APIRouter(prefix="/api/backup", tags=["backup"])


@router.get("", response_model=BackupOut)
# Returns all of a visitor's expenses and budget as a backup
def export_backup(
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Expense)
        .where(Expense.client_id == client_id)
        .order_by(Expense.date.desc(), Expense.timestamp.desc())
    )
    expenses = [ExpenseOut.model_validate(item) for item in db.scalars(stmt).all()]
    budget = db.get(Budget, client_id)
    return BackupOut(
        expenses=expenses,
        budget=budget.amount if budget else DEFAULT_BUDGET,
        exportDate=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    )


@router.post("/import")
# Replaces a visitor's expenses with the ones in an uploaded backup
def import_backup(
    payload: BackupImport,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    # Import replaces the visitor's expenses (if any exists)
    db.execute(delete(Expense).where(Expense.client_id == client_id))
    now = int(time.time() * 1000)
    for item in payload.expenses:
        db.add(
            Expense(
                id=f"exp_{uuid.uuid4().hex}",
                client_id=client_id,
                amount=item.amount,
                category=item.category,
                description=item.description,
                date=item.date,
                timestamp=item.timestamp or now,
            )
        )
    if payload.budget is not None:
        upsert_budget(db, client_id, payload.budget)
    db.commit()
    return {"imported": len(payload.expenses)}