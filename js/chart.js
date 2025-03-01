document.addEventListener('DOMContentLoaded', async () => {
    const categorycharts = document.getElementById('optionselect');
    let categoryvalue = categorycharts.value; // Set initial value based on dropdown default
    let month = sessionStorage.getItem('month');
    let year = sessionStorage.getItem('year');
    let chartInstance = null; // Variable to store the chart instance

    // Function to fetch and display data based on categoryvalue
    const fetchDataAndRenderChart = async () => {
        let hasData=false
        try {
            // Fetch income data
            let category1Totals = {};
            const incomeResponse = await fetch(`https://money-manager-9p85.onrender.com/fetch_income?month=${month}&year=${year}`);
            if (!incomeResponse.ok) {
                throw new Error(`HTTP error! Status: ${incomeResponse.status}`);
            }
            const incomeData = await incomeResponse.json();
            if(incomeData.length>0){
                hasData=true
            }
            let totalIncome = 0;
            incomeData.forEach(record => {
                totalIncome += parseFloat(record.amount);
                const category = record.source;
                if (category1Totals[category]) {
                    category1Totals[category] += parseFloat(record.amount);
                } else {
                    category1Totals[category] = parseFloat(record.amount);
                }
            });
            document.getElementById('income_amount').innerText = totalIncome.toFixed(2);

            // Fetch expenses data
            let categoryTotals = {};
            const expensesResponse = await fetch(`https://money-manager-9p85.onrender.com/fetch_expenses?month=${month}&year=${year}`);
            if (!expensesResponse.ok) {
                throw new Error(`HTTP error! Status: ${expensesResponse.status}`);
            }
            const expensesData = await expensesResponse.json();
            if(expensesData.length>0){
                hasData=true
            }
            let totalExpenses = 0;
            expensesData.forEach(record => {
                totalExpenses += parseFloat(record.amount);
                const category = record.category;
                if (categoryTotals[category]) {
                    categoryTotals[category] += parseFloat(record.amount);
                } else {
                    categoryTotals[category] = parseFloat(record.amount);
                }
            });
            document.getElementById('expenses_amount').innerText = totalExpenses.toFixed(2);

            // Calculate and display balance
            let totalBalance = totalIncome - totalExpenses;
            document.getElementById('balance_amount').innerText = totalBalance.toFixed(2);
            const recordsDiv = document.querySelector('.no_records');
                if (hasData) {
                    recordsDiv.style.display = 'none';
                } else {
                    recordsDiv.style.display = 'flex';
                }
            // Destroy existing chart if it exists
            if (chartInstance) {
                chartInstance.destroy();
            }

            // Prepare data for the chart
            let categories, amounts, percentages;
            const colors = [
                '#F0A500', '#007bff', '#28a745', '#dc3545', '#6c757d',
                '#8e44ad', '#f39c12', '#16a085', '#e74c3c', '#34495e',
                '#d35400', '#2ecc71', '#1abc9c', '#e67e22', '#9b59b6',
                '#2980b9', '#e74c3c', '#27ae60', '#f1c40f', '#c0392b',
                '#bdc3c7', '#2c3e50', '#95a5a6', '#7f8c8d', '#8e44ad',
                '#3498db', '#1abc9c', '#9b59b6'
            ];

            if (categoryvalue == 1) {
                categories = Object.keys(categoryTotals);
                amounts = categories.map(category => categoryTotals[category]);
                percentages = amounts.map(amount => (amount / totalExpenses) * 100);
            } else if (categoryvalue == 2) {
                categories = Object.keys(category1Totals);
                amounts = categories.map(category => category1Totals[category]);
                percentages = amounts.map(amount => (amount / totalIncome) * 100);
            }

            // Create donut chart
            const ctx = document.getElementById('expensesChart').getContext('2d');
            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categories,
                    datasets: [{
                        data: amounts,
                        backgroundColor: colors.slice(0, categories.length),
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: 'white',
                                generateLabels: function (chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map((label, index) => {
                                            const value = data.datasets[0].data[index];
                                            const percentage = percentages[index].toFixed(2);
                                            const color = data.datasets[0].backgroundColor[index];
                                            return {
                                                text: `${label}: ${percentage}%`,
                                                fillStyle: color,
                                                fontColor: 'white',
                                                hidden: isNaN(value) || value <= 0,
                                                lineCap: 'butt',
                                                lineDash: [],
                                                lineDashOffset: 0,
                                                lineJoin: 'miter',
                                                strokeStyle: color,
                                                pointStyle: 'circle',
                                                datasetIndex: 0,
                                                index: index
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += context.raw.toFixed(2);
                                    return label;
                                }
                            }
                        }
                    }
                }
            });

            // Sort categories by their respective amounts in descending order
            const sortedCategories = categories.map((category, index) => ({
                category,
                amount: amounts[index],
                percentage: percentages[index]
            })).sort((a, b) => b.amount - a.amount);

            // Get the progress bar container
            const progressBarContainer = document.getElementById('progress-bars');

            // Clear the container
            progressBarContainer.innerHTML = '';

            // Create progress bars for each category
            sortedCategories.forEach(item => {
                const progressBarWrapper = document.createElement('div');
                progressBarWrapper.classList.add('progress-bar-wrapper');

                const label = document.createElement('div');
                label.classList.add('progress-label');
                label.innerText = `${item.category}: ${item.percentage.toFixed(2)}%`;

                const progressBar = document.createElement('div');
                progressBar.classList.add('progress-bar');
                progressBar.style.width = `${item.percentage}%`;
                progressBar.style.backgroundColor = colors[categories.indexOf(item.category)];

                progressBarWrapper.appendChild(label);
                progressBarWrapper.appendChild(progressBar);
                progressBarContainer.appendChild(progressBarWrapper);
            });

        } catch (error) {
            console.log("Error displaying data on webpage:", error);
        }
    };

    // Initial fetch and render
    fetchDataAndRenderChart();

    // Re-fetch and re-render on category change
    categorycharts.addEventListener('change', (event) => {
        categoryvalue = event.target.value;
        fetchDataAndRenderChart();  // Re-fetch and re-render when category changes
    });
});
