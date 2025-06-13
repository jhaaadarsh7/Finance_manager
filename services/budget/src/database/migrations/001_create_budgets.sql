-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'weekly', 'yearly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT unique_user_category_period UNIQUE (user_id, category_id, period_type, start_date)
);

-- Create budget_spending table
CREATE TABLE IF NOT EXISTS budget_spending (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    expense_id INTEGER,
    amount DECIMAL(12, 2) NOT NULL,
    spending_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period_type, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);
CREATE INDEX IF NOT EXISTS idx_budget_spending_budget_id ON budget_spending(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_spending_date ON budget_spending(spending_date);
CREATE INDEX IF NOT EXISTS idx_budget_spending_expense_id ON budget_spending(expense_id);

-- Trigger: auto-update `updated_at`
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE budgets IS 'Main budget configuration table';
COMMENT ON TABLE budget_spending IS 'Tracks actual spending against budgets';
COMMENT ON COLUMN budgets.period_type IS 'Budget period: monthly, weekly, yearly, or custom';
COMMENT ON COLUMN budgets.amount IS 'Budget limit amount in decimal format';
COMMENT ON COLUMN budget_spending.expense_id IS 'Reference to expense from expense service. Note: Foreign key constraint not added as expense service uses a separate database';
