document.addEventListener('DOMContentLoaded', () => {
    const monthSelect = document.getElementById('monthselect');
    const yearSelect = document.getElementById('yearselect');
    let storedMonth = sessionStorage.getItem('month');
    let storedYear = sessionStorage.getItem('year');

    if (storedMonth && storedYear) {
        monthSelect.value = storedMonth;
        yearSelect.value = storedYear;
    } else {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        monthSelect.value = currentMonth;
        yearSelect.value = currentYear;
    }

    let month = monthSelect.value;
    let year = yearSelect.value;
    sessionStorage.setItem('month', month);
    sessionStorage.setItem('year', year);

    // Initial data fetch if month and year are set on page load
    fetchData(month, year);

    // Event listener to handle changes in month select
    monthSelect.addEventListener('change', (event) => {
        month = event.target.value;
        sessionStorage.setItem('month', month);
        fetchData(month, year);
    });

    // Event listener to handle changes in year select
    yearSelect.addEventListener('change', (event) => {
        year = event.target.value;
        sessionStorage.setItem('year', year);
        fetchData(month, year);
    });
});

// Function to fetch and display data based on month and year
async function fetchData(month, year) {
    let hasData = false;

    if (!month || !year) {
        console.log('Month or year is not selected.');
        return;
    }

    try {
        // Fetch income data
        const response = await fetch(`http://localhost:3000/fetch_income?month=${month}&year=${year}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.length > 0) {
            hasData = true;
        }
        let totalIncome = 0;
        const recordDiv = document.querySelector('.income-records');
        recordDiv.innerHTML = '';
        data.forEach(record => {
            totalIncome += parseFloat(record.amount);
            const recordHtml = `
                <div class="income_records" data-id="${record.id}">
                    <span>Source: ${record.source}</span>
                    <span>Amount: ${record.amount}</span>
                    <span>Note: ${record.description}</span>
                    <span>Date: ${new Date(record.date).toLocaleString()}</span>
                    <div class="button-container">
                        <button class="edit_income">Edit</button>
                        <button class="delete_income">Delete</button>
                    </div>
                </div>
            `;
            recordDiv.innerHTML += recordHtml;
        });
        document.getElementById('income_amount').innerText = totalIncome.toFixed(2);

        // Fetch and display expenses data
        const expensesResponse = await fetch(`http://localhost:3000/fetch_expenses?month=${month}&year=${year}`);
        if (!expensesResponse.ok) {
            throw new Error(`HTTP error! Status: ${expensesResponse.status}`);
        }
        const expensesData = await expensesResponse.json();
        if (expensesData.length > 0) {
            hasData = true;
        }
        let totalExpenses = 0;
        const expensesRecordDiv = document.querySelector('.expenses-records');
        expensesRecordDiv.innerHTML = '';
        expensesData.forEach(record => {
            totalExpenses += parseFloat(record.amount);
            const expensesRecordHtml = `
                <div class="expenses_records" data-id="${record.id}">
                    <span>Category: ${record.category}</span>
                    <span>Amount: ${record.amount}</span>
                    <span>Note: ${record.description}</span>
                    <span>Date: ${new Date(record.date).toLocaleString()}</span>
                    <div class="button-container">
                        <button class="edit_expenses">Edit</button>
                        <button class="delete_expenses">Delete</button>
                    </div>
                </div>
            `;
            expensesRecordDiv.innerHTML += expensesRecordHtml;
        });
        document.getElementById('expenses_amount').innerText = totalExpenses.toFixed(2);

        let totalBalance = totalIncome - totalExpenses;
        document.getElementById('balance_amount').innerText = totalBalance.toFixed(2);

        // Fetch and display budget data
        const budgetResponse = await fetch(`http://localhost:3000/fetch_budget?month=${month}&year=${year}`);
        if (!budgetResponse.ok) {
            throw new Error(`HTTP error! Status: ${budgetResponse.status}`);
        }
        const budgetData = await budgetResponse.json();
        if (budgetData.length > 0) {
            hasData = true;
        }
        const budgetRecordDiv = document.querySelector('.budget-records');
        budgetRecordDiv.innerHTML = '';
        budgetData.forEach(record => {
            const budgetRecordHtml = `
                <div class="budget_records" data-id="${record.id}">
                    <span>Category: ${record.category}</span>
                    <span>Amount: ${record.amount}</span>
                    <span>Date: ${new Date(record.date).toLocaleString()}</span>
                    <div class="button-container">
                        <button class="edit_budget">Edit</button>
                        <button class="delete_budget">Delete</button>
                    </div>
                </div>
            `;
            budgetRecordDiv.innerHTML += budgetRecordHtml;
        });

        const recordsDiv = document.querySelector('.no_records');
        if (hasData) {
            recordsDiv.style.display = 'none';
        } else {
            recordsDiv.style.display = 'flex';
        }

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete_income').forEach(button => {
            button.addEventListener('click', handleIncomeDeletion);
        });
        document.querySelectorAll('.delete_expenses').forEach(button => {
            button.addEventListener('click', handleExpensesDeletion);
        });
        document.querySelectorAll('.delete_budget').forEach(button => {
            button.addEventListener('click', handleBudgetDeletion);
        });

        // Add event listeners for edit buttons
        const closeButton = document.getElementsByClassName('close-icon')[0];
        const modal = document.getElementsByClassName('form')[0];
        const category = document.getElementById('id');
        document.querySelectorAll('.edit_income').forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = e.target.closest('.income_records').dataset.id;
                modal.style.display = 'block';
                category.value = recordId;
                e.preventDefault();
            });
        });
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        const closeButton1 = document.getElementsByClassName('close-icon1')[0];
        const modal1 = document.getElementsByClassName('form1')[0];
        const category1 = document.getElementById('id1');
        document.querySelectorAll('.edit_expenses').forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = e.target.closest('.expenses_records').dataset.id;
                modal1.style.display = 'block';
                category1.value = recordId;
                e.preventDefault();
            });
        });
        closeButton1.addEventListener('click', () => {
            modal1.style.display = 'none';
        });

        const closeButton2 = document.getElementsByClassName('close-icon2')[0];
        const modal2 = document.getElementsByClassName('form2')[0];
        const category2 = document.getElementById('id2');
        document.querySelectorAll('.edit_budget').forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = e.target.closest('.budget_records').dataset.id;
                modal2.style.display = 'block';
                category2.value = recordId;
                e.preventDefault();
            });
        });
        closeButton2.addEventListener('click', () => {
            modal2.style.display = 'none';
        });

    } catch (error) {
        console.log("Error displaying data on webpage", error);
    }
}

// Make sure these functions are defined outside of the DOMContentLoaded event listener
async function handleIncomeDeletion(event) {
    const recordId = event.target.closest('.income_records').dataset.id;
    console.log(`The record id from income table is ${recordId}`);
    try {
        const response = await fetch(`http://localhost:3000/delete_income/${recordId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            event.target.closest('.income_records').remove();
            showToast("Record deleted successfully");
            const month = sessionStorage.getItem('month');
            const year = sessionStorage.getItem('year');
            fetchData(month, year);
        } else {
            console.log("Error in deleting the income data");
        }
    } catch (error) {
        console.log("Error on fetching", error);
    }
}

async function handleExpensesDeletion(event) {
    const recordId = event.target.closest('.expenses_records').dataset.id;
    console.log(`Record id from expenses table is ${recordId}`);
    try {
        const response = await fetch(`http://localhost:3000/delete_expenses/${recordId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            event.target.closest('.expenses_records').remove();
            showToast("Record deleted successfully");
            const month = sessionStorage.getItem('month');
            const year = sessionStorage.getItem('year');
            fetchData(month, year);
        } else {
            console.log("Error in deleting expenses data");
        }
    } catch (error) {
        console.log("Error on fetching", error);
    }
}

async function handleBudgetDeletion(event) {
    const recordId = event.target.closest('.budget_records').dataset.id;
    console.log(`Record id from budget table is ${recordId}`);
    try {
        const response = await fetch(`http://localhost:3000/delete_budget/${recordId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            event.target.closest('.budget_records').remove();
            showToast("Record deleted successfully");
            const month = sessionStorage.getItem('month');
            const year = sessionStorage.getItem('year');
            fetchData(month, year);
        } else {
            console.log("Error in deleting budget data");
        }
    } catch (error) {
        console.log("Error on fetching", error);
    }
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
