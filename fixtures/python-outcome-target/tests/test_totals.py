import pytest

from ledger.totals import LedgerError, monthly_totals, render


@pytest.mark.outcome("monthly-totals-happy")
def test_bookkeeper_reads_one_total_per_month_in_order():
    rows = ["date,amount", "2026-02-03,5.50", "2026-01-09,10", "2026-02-20,1.25"]
    assert render(monthly_totals(rows)) == "2026-01 10\n2026-02 6.75"


@pytest.mark.outcome("monthly-totals-bad-amount")
def test_unparsable_amount_is_refused_with_its_line():
    with pytest.raises(LedgerError, match="line 3"):
        monthly_totals(["date,amount", "2026-01-01,1", "2026-01-02,one"])
