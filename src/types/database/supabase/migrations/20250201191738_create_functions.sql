CREATE OR REPLACE FUNCTION UpdateAccountBalance(accountid uuid, amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    new_balance NUMERIC;
BEGIN
    -- Update the balance and return the new balance
    UPDATE accounts
    SET balance = balance + amount
    WHERE id = accountid
    RETURNING balance INTO new_balance;

    -- Return the new balance
    RETURN new_balance;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION RefreshTransactionsView()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW TransactionsView;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
grant execute on function RefreshTransactionsView() to authenticated;


CREATE OR REPLACE TRIGGER RefreshTransactionsView
AFTER INSERT OR UPDATE OR DELETE ON Transactions
FOR EACH STATEMENT
EXECUTE FUNCTION RefreshTransactionsView();