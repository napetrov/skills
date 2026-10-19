"""Monthly totals from a CSV of ``date,amount`` rows."""

import csv
from decimal import Decimal, InvalidOperation


class LedgerError(ValueError):
    pass


def monthly_totals(lines):
    totals = {}
    for number, row in enumerate(csv.reader(lines), start=1):
        if not row or row[0] == "date":
            continue
        date, amount = row[0], row[1]
        try:
            value = Decimal(amount)
        except InvalidOperation:
            raise LedgerError(f"line {number}: amount {amount!r} is not a number") from None
        month = date[:7]
        totals[month] = totals.get(month, Decimal(0)) + value
    return dict(sorted(totals.items()))


def render(totals):
    return "\n".join(f"{month} {value}" for month, value in totals.items())
