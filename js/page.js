let buttons = document.querySelectorAll('.btn');
let closebutton=document.getElementsByClassName('close-icon')[0]
let modal = document.getElementsByClassName('form')[0];
let categoryInput = document.getElementById('expenses_category');
let category_value=document.getElementById('expenses_category')
buttons.forEach(button=>{
    button.addEventListener('click',(e)=>{
        modal.style.display="block"
        let category_item=e.currentTarget.querySelector('.category').dataset.name
        console.log(category_item)
        category_value.value=category_item
        e.preventDefault()
    })
})
closebutton.addEventListener('click',(e)=>{
    modal.style.display="none"
})
const categoryList = [
    "Shopping", "Phone", "Food", "Entertainment", "Education", "Beauty", 
    "Sport", "Social", "Transportation", "Clothing", "Car", "Drinks", 
    "Cigarette", "Electronics", "Travel", "Health", "Pet", "Repair", 
    "Housing", "Home", "Gift", "Donation", "Lottery", "Snacks", "Child", 
    "Vegetable", "Fruit", "Others","Salary", "Part-time", "Awards", "Rewards"
];

function toggleSuggestions(selectElement) {
    const form = selectElement.closest("form");
    const suggestionsDiv = form.querySelector(".suggestions-box");

    if (selectElement.value === "source") {
        suggestionsDiv.style.display = "block";
    } else {
        suggestionsDiv.style.display = "none";
    }
}

function filterCategories(inputElement) {
    const form = inputElement.closest("form");
    const suggestionsDiv = form.querySelector(".suggestions-box");
    const attribute = form.querySelector('[name="attribute"]').value; // Fix here

    if (attribute !== "source") {
        suggestionsDiv.style.display = "none";
        return;
    }

    suggestionsDiv.innerHTML = "";
    const input = inputElement.value.toLowerCase();
    
    const filtered = categoryList.filter(category => category.toLowerCase().includes(input));

    if (filtered.length === 0) {
        suggestionsDiv.style.display = "none";
        return;
    }

    filtered.forEach(category => {
        const div = document.createElement("div");
        div.textContent = category;
        div.className = "suggestion-item";
        div.onclick = () => {
            inputElement.value = category;
            suggestionsDiv.style.display = "none";
        };
        suggestionsDiv.appendChild(div);
    });

    suggestionsDiv.style.display = "block";
}


// Hide suggestions when clicking outside
document.addEventListener("click", (event) => {
    if (!event.target.closest(".suggestions-box") && !event.target.classList.contains("update_value")) {
        document.querySelectorAll(".suggestions-box").forEach(div => div.style.display = "none");
    }
});
