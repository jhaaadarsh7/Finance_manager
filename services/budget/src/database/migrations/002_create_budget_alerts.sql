-- Create budget_alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('warning', 'exceeded', 'approaching')),
    threshold_percentage INTEGER NOT NULL CHECK (threshold_percentage BETWEEN 1 AND 200),
    is_enabled BOOLEAN DEFAULT true,
    is_triggered BOOLEAN DEFAULT false,
    last_triggered TIMESTAMP,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicate alerts
    CONSTRAINT unique_budget_alert UNIQUE (budget_id, alert_type, threshold_percentage)
);

-- Create budget_alert_history table to track alert notifications
CREATE TABLE IF NOT EXISTS budget_alert_history (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES budget_alerts(id) ON DELETE CASCADE,
    budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    spent_amount DECIMAL(12,2) NOT NULL,
    budget_amount DECIMAL(12,2) NOT NULL,
    percentage_used DECIMAL(5,2) NOT NULL,
    alert_message TEXT,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_budgets_alerts_id ON budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_type ON budget_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_enabled ON budget_alerts(is_enabled);
CREATE INDEX IF NOT EXISTS idx_budget_alert_history_budget_id ON budget_alert_history(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alert_history_triggered_at ON budget_alert_history(triggered_at);


-- Create trigger for budget_alerts updated_at
DROP TRIGGER IF EXISTS update_budget_alerts_updated_at ON budget_alerts;
CREATE TRIGGER update_budget_alerts_updated_at
    BEFORE UPDATE ON budget_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to check and trigger budget alerts
CREATE OR REPLACE FUNCTION check_budget_alerts(p_budget_id INTEGER)
RETURNS TABLE(
    alert_id INTEGER,
    alert_type VARCHAR(20),
    threshold_percentage INTEGER,
    current_percentage DECIMAL(5,2),
    message TEXT
) AS $$
DECLARE
    budget_rec RECORD;
    spent_amount DECIMAL(12,2);
    percentage_used DECIMAL(5,2);
    alert_rec RECORD;
BEGIN
    -- Get budget information
    SELECT b.id, b.name, b.amount, b.user_id
    INTO budget_rec
    FROM budgets b
    WHERE b.id = p_budget_id AND b.is_active = true;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate spent amount
    SELECT COALESCE(SUM(bs.amount), 0)
    INTO spent_amount
    FROM budget_spending bs
    WHERE bs.budget_id = p_budget_id;
    
    -- Calculate percentage used
    percentage_used = CASE 
        WHEN budget_rec.amount > 0 THEN ROUND((spent_amount / budget_rec.amount * 100), 2)
        ELSE 0
    END;
    
    -- Check each active alert for this budget
    FOR alert_rec IN 
        SELECT ba.id, ba.alert_type, ba.threshold_percentage, ba.is_triggered
        FROM budget_alerts ba
        WHERE ba.budget_id = p_budget_id 
        AND ba.is_enabled = true
    LOOP
        -- Check if alert should be triggered
        IF percentage_used >= alert_rec.threshold_percentage AND NOT alert_rec.is_triggered THEN
            -- Update alert as triggered
            UPDATE budget_alerts 
            SET is_triggered = true, last_triggered = CURRENT_TIMESTAMP
            WHERE id = alert_rec.id;
            
            -- Insert into alert history
            INSERT INTO budget_alert_history (
                alert_id, budget_id, spent_amount, budget_amount, 
                percentage_used, alert_message
            ) VALUES (
                alert_rec.id, p_budget_id, spent_amount, budget_rec.amount,
                percentage_used, 
                format('Budget "%s" has reached %s%% of limit ($%s/$%s)', 
                       budget_rec.name, percentage_used, spent_amount, budget_rec.amount)
            );
            
            -- Return alert info
            alert_id := alert_rec.id;
            alert_type := alert_rec.alert_type;
            threshold_percentage := alert_rec.threshold_percentage;
            current_percentage := percentage_used;
            message := format('Budget "%s" has reached %s%% of limit', 
                            budget_rec.name, percentage_used);
            
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE budget_alerts IS 'Budget alert configuration';
COMMENT ON TABLE budget_alert_history IS 'History of triggered budget alerts';
COMMENT ON FUNCTION check_budget_alerts IS 'Checks and triggers budget alerts for a specific budget';

