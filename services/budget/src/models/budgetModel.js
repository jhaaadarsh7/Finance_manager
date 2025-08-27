const {query} = require('../config/database')


class BudgetModel {

    async create(budgetData){
        const{
              user_id, 
      category_id, 
      amount, 
      period, 
      start_date, 
      end_date, 
      description,
      alert_threshold = 80 
        }= budgetData


        const sql = `
        Insert into budgets(
           user_id, 
        category_id, 
        amount, 
        period, 
        start_date, 
        end_date, 
        description,
        alert_threshold,
        created_at,
        updated_at
        )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING 
        id,
        user_id,
        category_id,
        amount,
        period,
        start_date,
        end_date,
        description,
        alert_threshold,
        created_at,
        updated_at
    `;

    
        
    }
}