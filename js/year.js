document.addEventListener('DOMContentLoaded', async () => {
    let year = sessionStorage.getItem('year') || new Date().getFullYear();
    const yearSelect = document.getElementById('yearselect');
    yearSelect.value = year;
    const categorySelect = document.getElementById('optionselect');
    let categoryValue = categorySelect.value;
    let chartInstance = null;

    const fetchYearCharts = async () => {
        let hasData = false;
        const monthNames = {
            "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun",
            "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
        };
        
        let monthTotals = {};
        let month1Totals = {};
        const colors = [
            '#F0A500', '#007bff', '#28a745', '#dc3545', '#6c757d',
            '#8e44ad', '#f39c12', '#16a085', '#e74c3c', '#34495e',
            '#d35400', '#2ecc71', '#1abc9c', '#e67e22', '#9b59b6',
            '#2980b9', '#e74c3c', '#27ae60', '#f1c40f', '#c0392b',
            '#bdc3c7', '#2c3e50', '#95a5a6', '#7f8c8d', '#8e44ad',
            '#3498db', '#1abc9c', '#9b59b6'
        ];

        try {
            // Fetch income data for the year
            const incomeResponse = await fetch(`http://localhost:3000/fetch_yearincome?year=${year}`);
            if (!incomeResponse.ok) throw new Error(`HTTP error! Status: ${incomeResponse.status}`);
            const incomeData = await incomeResponse.json();

            let totalIncome = 0;
            incomeData.forEach(record => {
                const month = record.month.toString();
                totalIncome += parseFloat(record.amount);
                monthTotals[month] = (monthTotals[month] || 0) + parseFloat(record.amount);
            });

            document.getElementById('income_amount').innerText = totalIncome.toFixed(2);

            // Fetch expenses data for the year
            const expensesResponse = await fetch(`http://localhost:3000/fetch_yearexpenses?year=${year}`);
            if (!expensesResponse.ok) throw new Error(`HTTP error! Status: ${expensesResponse.status}`);
            const expensesData = await expensesResponse.json();

            let totalExpenses = 0;
            expensesData.forEach(record => {
                const month = record.month.toString();
                totalExpenses += parseFloat(record.amount);
                month1Totals[month] = (month1Totals[month] || 0) + parseFloat(record.amount);
            });

            document.getElementById('expenses_amount').innerText = totalExpenses.toFixed(2);

            // Calculate and display balance
            let totalBalance = totalIncome - totalExpenses;
            document.getElementById('balance_amount').innerText = totalBalance.toFixed(2);

            // Check if there is data
            hasData = Object.keys(monthTotals).length > 0 || Object.keys(month1Totals).length > 0;
            document.querySelector('.no_records').style.display = hasData ? 'none' : 'flex';

            // Destroy existing chart if it exists
            if (chartInstance) chartInstance.destroy();

            let months, amounts, percentages;
            if (categoryValue == 1) {
                // Expenses chart
                months = Object.keys(month1Totals).sort((a, b) => a - b).map(month => monthNames[month]);
                amounts = Object.keys(month1Totals).sort((a, b) => a - b).map(month => month1Totals[month] || 0);
                percentages = amounts.map(amount => totalExpenses ? (amount / totalExpenses) * 100 : 0);
            } else {
                // Income chart
                months = Object.keys(monthTotals).sort((a, b) => a - b).map(month => monthNames[month]);
                amounts = Object.keys(monthTotals).sort((a, b) => a - b).map(month => monthTotals[month] || 0);
                percentages = amounts.map(amount => totalIncome ? (amount / totalIncome) * 100 : 0);
            }

            // Create doughnut chart for income and expenses
            const ctx = document.getElementById('expensesChart').getContext('2d');
            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: months,
                    datasets: [{
                        data: amounts,
                        backgroundColor: colors.slice(0, months.length),
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

            // Sort months by their respective amounts in descending order
            const sortedMonths = months.map((month, index) => ({
                month,
                amount: amounts[index],
                percentage: percentages[index]
            })).sort((a, b) => b.amount - a.amount);

            // Get the progress bar container
            const progressBarContainer = document.getElementById('progress-bars');

            // Clear the container
            progressBarContainer.innerHTML = '';

            // Create progress bars for each month
            sortedMonths.forEach((item, index) => {
                const progressBarWrapper = document.createElement('div');
                progressBarWrapper.classList.add('progress-bar-wrapper');

                const label = document.createElement('div');
                label.classList.add('progress-label');
                label.innerText = `${item.month}: ${item.percentage.toFixed(2)}%`;

                const progressBar = document.createElement('div');
                progressBar.classList.add('progress-bar');
                progressBar.style.width = `${item.percentage}%`;
                progressBar.style.backgroundColor = colors[index % colors.length];

                progressBarWrapper.appendChild(label);
                progressBarWrapper.appendChild(progressBar);
                progressBarContainer.appendChild(progressBarWrapper);
            });

        } catch (error) {
            console.error("Error displaying data on webpage:", error);
        }
    };

    // Initial fetch and render
    fetchYearCharts();

    // Re-fetch and re-render on year change
    yearSelect.addEventListener('change', (event) => {
        year = event.target.value;
        sessionStorage.setItem('year', year);
        fetchYearCharts();
    });

    // Re-fetch and re-render on category change
    categorySelect.addEventListener('change', (event) => {
        categoryValue = event.target.value;
        fetchYearCharts();
    });
});
