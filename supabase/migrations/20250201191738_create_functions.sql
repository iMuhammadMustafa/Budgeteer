CREATE OR REPLACE FUNCTION UpdateAccountBalance(accountid INT, amount NUMERIC)
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
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW TransactionsView;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER RefreshTransactionsView
AFTER INSERT OR UPDATE OR DELETE ON Transactions
FOR EACH STATEMENT
EXECUTE FUNCTION RefreshTransactionsView();














/*
I want 

on DELETE  =>  check IsDeleted AND IsVoid
- if both = false => update the running balance on later transactions (subtract the amount) 



on INSERT   
- IsDeleted AND IsVoid = false 
    => SET the transaction's running balance and transactions that are in later dates 

-  IsDeleted OR IsVoid = true 
    => SET the transaction's running balance, but don't update later transactions  


on UPDATE
Handle amount change, account change, IsDeleted change, IsVoid Change
    
    - If it was Deleted/Void 
        if IsDeleted and IsVoid became false
            Set it's running balance to previous + amount and update and subsequent transactions' running balance
            Keep in mind new AccountId or new Amount if changed


    - If it wasn't Deleted/Void
        If it became Deleted/Void 
            => update the running balance on later transactions (subtract the amount)
        ELSE
            If Amount changed
                Update its running balance - old + new as well as subsequent transactions' running balance
            If account changed 
                - update subsequent transactions of old AccountId to subtract the old amount 
                - Update subsequent transactions of the new AccountId to add the old amount 
                - Update its running balance to be previous running + new amount 
*/