const expenseCOntroller ={ 
   async createExpense(req,res,next){
try {
    const userId = req.user.id;
    const expenseData = {...req.body,userId};

    const expense = await expenseService.createExpense(expenseData);
res.status(201).json(
    createResponse(true,'Expense created successfully',expense)
);

} catch (error) {
        next(error);
  
}
}}
