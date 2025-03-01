document.addEventListener('DOMContentLoaded', async () => {
    let month = sessionStorage.getItem('month');
    let year = sessionStorage.getItem('year');

    try {
        // Fetch income data
        const incomeResponse = await fetch(`https://money-manager-9p85.onrender.com/fetch_income?month=${month}&year=${year}`);
        if (!incomeResponse.ok) {
            throw new Error(`HTTP error! Status: ${incomeResponse.status}`);
        }
        const incomeData = await incomeResponse.json();
        let totalIncome = 0;
        incomeData.forEach(record => {
            totalIncome += parseFloat(record.amount);
        });
        document.getElementById('income_amount').innerText = totalIncome.toFixed(2);

        // Fetch expenses data
        const expensesResponse = await fetch(`https://money-manager-9p85.onrender.com/fetch_expenses?month=${month}&year=${year}`);
        if (!expensesResponse.ok) {
            throw new Error(`HTTP error! Status: ${expensesResponse.status}`);
        }
        const expensesData = await expensesResponse.json();
        let totalExpenses = 0;
        expensesData.forEach(record => {
            totalExpenses += parseFloat(record.amount);
        });
        document.getElementById('expenses_amount').innerText = totalExpenses.toFixed(2);

        // Calculate and display balance
        let totalBalance = totalIncome - totalExpenses;
        document.getElementById('balance_amount').innerText = totalBalance.toFixed(2);

        // Fetch budget data
        const budgetResponse = await fetch(`https://money-manager-9p85.onrender.com/fetch_monthlybudget?month=${month}&year=${year}`);
        if (!budgetResponse.ok) {
            throw new Error(`HTTP error! Status: ${budgetResponse.status}`);
        }
        const budgetData = await budgetResponse.json();
        let monthlyBudget = 0;
        if (budgetData.length > 0) {
            monthlyBudget = parseFloat(budgetData[0].amount);
            console.log(`The monthly budget is ${monthlyBudget}`);
            console.log('The month and yaer is',month,year)
        } else {
            document.getElementById('percentage').innerText = "Monthy Budget Not Set";
            showToast("Monthly Budget is not set! Please set it in the budget section.");
        }

        let remainingAmount = parseFloat(monthlyBudget - totalExpenses);

        if (monthlyBudget > 0) {
            let remainingPercentage = (remainingAmount / monthlyBudget) * 100;
            if (remainingPercentage <= 100) {
                const progress = (remainingAmount / monthlyBudget).toFixed(2);
                document.getElementById('percentage').innerText = `${remainingPercentage.toFixed(2)}%`;
                const progressCircle = document.getElementById('progress-circle');
                progressCircle.style.strokeDashoffset = 565.48 * (1 - progress);
                document.getElementById('remaining_amount').innerText = `Remaining:${remainingAmount.toFixed(2)}`;
                document.getElementById('remaining_budget').innerText = `Budget:${monthlyBudget.toFixed(2)}`
                document.getElementById('remaining_expenses').innerText = `Expenses:${totalExpenses.toFixed(2)}`
            } else {
                document.getElementById('percentage').innerText = "Monthly Budget Exceeded";
            }
        } else {
            console.log("Monthly budget not found");
        }

        const categoryBudgetResponse = await fetch(`https://money-manager-9p85.onrender.com/fetch_budget?month=${month}&year=${year}`);
        if (!categoryBudgetResponse.ok) {
            throw new Error(`HTTP error! Status: ${categoryBudgetResponse.status}`);
        }

        const expensesCategoryResponse = await fetch(`https://money-manager-9p85.onrender.com/fetch_expenses?month=${month}&year=${year}`);
        if (!expensesCategoryResponse.ok) {
            throw new Error(`HTTP error! Status: ${expensesCategoryResponse.status}`);
        }

        let categoryTotals = {};
        const categoryBudgetData = await categoryBudgetResponse.json();
        const expensesCategoryData = await expensesCategoryResponse.json();

        expensesCategoryData.forEach(record => {
            if (categoryTotals[record.category]) {
                categoryTotals[record.category] += parseFloat(record.amount);
            } else {
                categoryTotals[record.category] = parseFloat(record.amount);
            }
        });

        categoryBudgetData.forEach(record => {
            const budgetCategory = record.category;
            const budgetAmount = parseFloat(record.amount);

            Object.keys(categoryTotals).forEach(category => {
                if (budgetCategory === category) {
                    const totalBudgetExpenses = categoryTotals[category];
                    console.log("Your expenses amount is", totalBudgetExpenses);
                    const remaining = (budgetAmount - totalBudgetExpenses).toFixed(2);
                    console.log(`Remaining is ${remaining}`);
                    let progress=(remaining/budgetAmount).toFixed(2)
                    let remainingCategoryPercentage
                    if(progress<=0){
                      remainingCategoryPercentage="Budget Exceeded"
                      progress=0  
                    }
                    else{
                        remainingCategoryPercentage = parseFloat((remaining / budgetAmount) * 100).toFixed(2)
                    }
                    console.log(`The remaining percentage is ${remainingCategoryPercentage}`);

                    const recordDiv = document.querySelector('.section');
                    const recordHtml = `
                        <div class="budget-container">
                          <div class="circle">
                          <h1 style="color: white">${budgetCategory}</h1>
                          <svg width="200" height="200">
                            <circle cx="100" cy="100" r="90" stroke="grey" stroke-width="10" fill="none"></circle>
                            <circle cx="100" cy="100" r="90" stroke="yellow" stroke-width="10" fill="none" stroke-dasharray="565.48" stroke-dashoffset=${565.48 * (1 - progress)} id="progress-circle"></circle>
                          </svg>
                         <div class="remaining_percentage">Remaining:${remainingCategoryPercentage}%</div>
                        </div>
                        <div class="details">
                            <div class="info">
                                <p id="remaining_amount">Remaining:${remaining}</p>
                                <p id="remaining_budget">Budget:${budgetAmount}</p>
                                <p id="remaining_expenses">Expenses:${totalBudgetExpenses}</p>
                            </div>
                </div>
                    `;
                    recordDiv.innerHTML += recordHtml;
                }
            });
        });

    } catch (error) {
        console.error("Error displaying data on the webpage", error);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000); // Adjust the timeout as needed
    }
});
