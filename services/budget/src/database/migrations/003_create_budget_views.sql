-- Create comprehensive budget summary view
CREATE OR REPLACE VIEW budget_summary AS
SELECT 
    b.id,
    b.user_id,
    b.category_id,
    b.name,
    b.description,
    b.amount as budget_amount,
    b.period_type,
    b.start_date,
    b.end_date,
    b.is_active,
    
    -- Spending calculations
    COALESCE(SUM(bs.amount), 0) as spent_amount,
    b.amount - COALESCE(SUM(bs.amount), 0) as remaining_amount,
    
    -- Percentage calculations
    CASE 
        WHEN b.amount > 0 THEN ROUND((COALESCE(SUM(bs.amount), 0)::numeric / b.amount::numeric * 100), 2)
        ELSE 0
    END as percentage_used,
    
    -- Status determination
    CASE
        WHEN COALESCE(SUM(bs.amount), 0) > b.amount THEN 'exceeded'
        WHEN COALESCE(SUM(bs.amount), 0) > (b.amount * 0.9) THEN 'critical'
        WHEN COALESCE(SUM(bs.amount), 0) > (b.amount * 0.8) THEN 'warning'
        WHEN COALESCE(SUM(bs.amount), 0) > (b.amount * 0.5) THEN 'moderate'
        ELSE 'safe'
    END as status,
    
    -- Days remaining in budget period
    CASE 
        WHEN b.end_date >= CURRENT_DATE THEN b.end_date - CURRENT_DATE
        ELSE 0
    END as days_remaining,
    
    -- Period progress
    CASE 
        WHEN b.end_date > b.start_date THEN 
            ROUND(((CURRENT_DATE - b.start_date)::numeric / (b.end_date - b.start_date)::numeric * 100), 2)
        ELSE 100
    END as period_progress_percentage,
    
    -- Spending velocity (average per day)
    CASE 
        WHEN CURRENT_DATE > b.start_date AND (CURRENT_DATE - b.start_date) > 0 THEN 
            ROUND((COALESCE(SUM(bs.amount), 0)::numeric / (CURRENT_DATE - b.start_date)::numeric), 2)
        WHEN CURRENT_DATE = b.start_date THEN
            COALESCE(SUM(bs.amount), 0)
        ELSE 0
    END as avg_daily_spending,
    
    -- Projected spending
    CASE 
        WHEN b.end_date > CURRENT_DATE AND CURRENT_DATE > b.start_date THEN 
            ROUND((COALESCE(SUM(bs.amount), 0)::numeric / GREATEST((CURRENT_DATE - b.start_date)::numeric, 1) * (b.end_date - b.start_date)::numeric), 2)
        ELSE COALESCE(SUM(bs.amount), 0)
    END as projected_spending,
    
    -- Alert count
    (SELECT COUNT(*) FROM budget_alerts ba WHERE ba.budget_id = b.id AND ba.is_enabled = true) as alert_count,
    (SELECT COUNT(*) FROM budget_alerts ba WHERE ba.budget_id = b.id AND ba.is_triggered = true) as triggered_alerts,
    
    -- Timestamps
    b.created_at,
    b.updated_at
FROM budgets b
LEFT JOIN budget_spending bs ON b.id = bs.budget_id
GROUP BY b.id, b.user_id, b.category_id, b.name, b.description, b.amount, 
         b.period_type, b.start_date, b.end_date, b.is_active, b.created_at, b.updated_at;

-- Create view for active budgets only
CREATE OR REPLACE VIEW active_budgets AS
SELECT * FROM budget_summary 
WHERE is_active = true 
AND end_date >= CURRENT_DATE;

-- Create view for budget alerts with summary
CREATE OR REPLACE VIEW budget_alerts_summary AS
SELECT 
    ba.id as alert_id,
    ba.budget_id,
    b.name as budget_name,
    b.user_id,
    ba.alert_type,
    ba.threshold_percentage,
    ba.is_enabled,
    ba.is_triggered,
    ba.last_triggered,
    bs.percentage_used,
    bs.status,
    bs.spent_amount,
    bs.budget_amount,
    ba.created_at,
    ba.updated_at
FROM budget_alerts ba
JOIN budgets b ON ba.budget_id = b.id
JOIN budget_summary bs ON b.id = bs.id;

-- Create function to get budget statistics for a user
CREATE OR REPLACE FUNCTION get_user_budget_stats(p_user_id INTEGER)
RETURNS TABLE(
    total_budgets INTEGER,
    active_budgets INTEGER,
    total_budget_amount DECIMAL(12,2),
    total_spent_amount DECIMAL(12,2),
    budgets_exceeded INTEGER,
    budgets_warning INTEGER,
    budgets_safe INTEGER,
    avg_budget_utilization DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_budgets,
        COUNT(CASE WHEN is_active = true THEN 1 END)::INTEGER as active_budgets,
        COALESCE(SUM(budget_amount), 0) as total_budget_amount,
        COALESCE(SUM(spent_amount), 0) as total_spent_amount,
        COUNT(CASE WHEN status = 'exceeded' THEN 1 END)::INTEGER as budgets_exceeded,
        COUNT(CASE WHEN status IN ('warning', 'critical') THEN 1 END)::INTEGER as budgets_warning,
        COUNT(CASE WHEN status = 'safe' THEN 1 END)::INTEGER as budgets_safe,
        COALESCE(AVG(percentage_used), 0) as avg_budget_utilization
    FROM budget_summary
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get monthly budget trends
CREATE OR REPLACE FUNCTION get_monthly_budget_trends(p_user_id INTEGER, p_months INTEGER DEFAULT 12)
RETURNS TABLE(
    month_year TEXT,
    total_budgets INTEGER,
    total_budget_amount DECIMAL(12,2),
    total_spent_amount DECIMAL(12,2),
    utilization_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(DATE_TRUNC('month', b.start_date), 'YYYY-MM') as month_year,
        COUNT(b.id)::INTEGER as total_budgets,
        SUM(b.amount) as total_budget_amount,
        COALESCE(SUM(spending.total_spent), 0) as total_spent_amount,
        CASE 
            WHEN SUM(b.amount) > 0 THEN 
                ROUND((COALESCE(SUM(spending.total_spent), 0)::numeric / SUM(b.amount)::numeric * 100), 2)
            ELSE 0
        END as utilization_percentage
    FROM budgets b
    LEFT JOIN (
        SELECT 
            budget_id,
            SUM(amount) as total_spent
        FROM budget_spending
        GROUP BY budget_id
    ) spending ON b.id = spending.budget_id
    WHERE b.user_id = p_user_id
    AND b.start_date >= CURRENT_DATE - INTERVAL '1 month' * p_months
    GROUP BY DATE_TRUNC('month', b.start_date)
    ORDER BY month_year DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create default alerts for new budgets
CREATE OR REPLACE FUNCTION create_default_budget_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default alerts for new budget
    INSERT INTO budget_alerts (budget_id, alert_type, threshold_percentage, is_enabled)
    VALUES 
        (NEW.id, 'warning', 80, true),
        (NEW.id, 'critical', 90, true),
        (NEW.id, 'exceeded', 100, true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create default alerts
DROP TRIGGER IF EXISTS create_budget_alerts_trigger ON budgets;
CREATE TRIGGER create_budget_alerts_trigger
    AFTER INSERT ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION create_default_budget_alerts();

COMMENT ON VIEW budget_summary IS 'Comprehensive budget summary with calculations';
COMMENT ON VIEW active_budgets IS 'Currently active budgets only';
COMMENT ON VIEW budget_alerts_summary IS 'Budget alerts with related budget information';
COMMENT ON FUNCTION get_user_budget_stats IS 'Get comprehensive budget statistics for a user';
COMMENT ON FUNCTION get_monthly_budget_trends IS 'Get monthly budget trends and utilization';