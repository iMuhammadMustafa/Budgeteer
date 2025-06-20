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

/*
CREATE OR REPLACE FUNCTION public.apply_reminder_transaction(reminder_id_param uuid)
RETURNS VOID AS $$
DECLARE
    reminder_record RECORD;
    new_transaction_id UUID;
    current_next_occurrence_date DATE;
    new_next_occurrence_date DATE;
    rrule_freq TEXT;
    rrule_interval_text TEXT;
    rrule_interval INT;
    tenant_id_val UUID;
    created_by_val UUID;
BEGIN
    -- 1. Fetch the reminder details
    SELECT * INTO reminder_record
    FROM public.reminders
    WHERE id = reminder_id_param AND is_active = TRUE;

    -- Exit if reminder not found or not active
    IF NOT FOUND THEN
        RAISE NOTICE 'Reminder % not found or not active for execution.', reminder_id_param;
        RETURN;
    END IF;

    -- Store current next_occurrence_date before it's updated
    current_next_occurrence_date := reminder_record.next_occurrence_date;
    tenant_id_val := reminder_record.tenant_id;
    created_by_val := reminder_record.created_by; -- Use the reminder's creator for the transaction

    -- 2. Create a new transaction
    -- Assuming reminder.amount is positive and represents an expense.
    -- Transaction type is 'Expense' and status defaults to 'Pending' from table definition.
    INSERT INTO public.transactions (
        name,
        description,
        amount,
        currency_code,
        date,
        accountid,
        categoryid,
        payee,
        notes,
        type, -- Defaulting to 'Expense'
        -- status will use table default 'Pending'
        tenant_id,
        created_by,
        reminder_id -- Link transaction to the reminder that generated it
    )
    VALUES (
        reminder_record.name,
        reminder_record.description,
        reminder_record.amount,
        reminder_record.currency_code,
        current_next_occurrence_date,
        reminder_record.source_account_id,
        reminder_record.category_id,
        reminder_record.payee_name,
        reminder_record.notes,
        'Expense',
        tenant_id_val,
        created_by_val,
        reminder_id_param
    )
    RETURNING id INTO new_transaction_id;

    RAISE NOTICE 'Created transaction % for reminder %', new_transaction_id, reminder_id_param;

    -- 3. Calculate the new next_occurrence_date
    -- Basic parsing for 'FREQ=X;INTERVAL=Y'
    SELECT trim(split_part(rule_part, '=', 2))
    INTO rrule_freq
    FROM unnest(string_to_array(reminder_record.recurrence_rule, ';')) AS rule_part
    WHERE rule_part LIKE 'FREQ=%'
    LIMIT 1;

    SELECT trim(split_part(rule_part, '=', 2))
    INTO rrule_interval_text
    FROM unnest(string_to_array(reminder_record.recurrence_rule, ';')) AS rule_part
    WHERE rule_part LIKE 'INTERVAL=%'
    LIMIT 1;

    IF rrule_freq IS NULL OR rrule_interval_text IS NULL THEN
        RAISE EXCEPTION 'Invalid recurrence_rule format for reminder %: %', reminder_id_param, reminder_record.recurrence_rule;
    END IF;

    rrule_interval := rrule_interval_text::INT;
    IF rrule_interval <= 0 THEN
        RAISE EXCEPTION 'INTERVAL must be positive in recurrence_rule for reminder %: %', reminder_id_param, reminder_record.recurrence_rule;
    END IF;

    IF rrule_freq = 'DAILY' THEN
        new_next_occurrence_date := current_next_occurrence_date + (rrule_interval * INTERVAL '1 day');
    ELSIF rrule_freq = 'WEEKLY' THEN
        new_next_occurrence_date := current_next_occurrence_date + (rrule_interval * INTERVAL '1 week');
    ELSIF rrule_freq = 'MONTHLY' THEN
        new_next_occurrence_date := current_next_occurrence_date + (rrule_interval * INTERVAL '1 month');
    ELSIF rrule_freq = 'YEARLY' THEN
        new_next_occurrence_date := current_next_occurrence_date + (rrule_interval * INTERVAL '1 year');
    ELSE
        RAISE EXCEPTION 'Unsupported FREQ value "%" in recurrence_rule for reminder %', rrule_freq, reminder_id_param;
    END IF;

    -- 4. Update the reminder
    UPDATE public.reminders
    SET
        last_executed_at = current_next_occurrence_date,
        next_occurrence_date = new_next_occurrence_date,
        is_active = CASE
                        WHEN reminder_record.end_date IS NOT NULL AND new_next_occurrence_date > reminder_record.end_date THEN FALSE
                        ELSE TRUE -- Keep it active if no end date or not past end date
                    END
    WHERE id = reminder_id_param;

    RAISE NOTICE 'Updated reminder %: next_occurrence_date set to %, last_executed_at to %', reminder_id_param, new_next_occurrence_date, current_next_occurrence_date;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in apply_reminder_transaction for reminder % (Transaction ID %): %', reminder_id_param, COALESCE(new_transaction_id::text, 'N/A'), SQLERRM;
        -- Re-raise the exception to ensure the calling transaction rolls back
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;