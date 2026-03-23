function updateMaxOrderToStock(stockInput) {
    const stockValue = parseInt(stockInput.value);
    const maxOrderField = document.getElementById('id_max_order');
    const minOrderField = document.getElementById('id_min_order');
    
    if (maxOrderField && !isNaN(stockValue)) {
        const currentMax = parseInt(maxOrderField.value);
        
        // Update max_order to match stock quantity (since it should not exceed stock)
        if (isNaN(currentMax) || currentMax > stockValue) {
            maxOrderField.value = stockValue;
            
            // Visual feedback
            maxOrderField.style.backgroundColor = '#d4edda';
            setTimeout(() => {
                maxOrderField.style.backgroundColor = '';
            }, 1000);
        }
        
        // Also ensure min_order doesn't exceed stock
        if (minOrderField) {
            const currentMin = parseInt(minOrderField.value);
            if (!isNaN(currentMin) && currentMin > stockValue) {
                minOrderField.value = stockValue;
            }
        }
        
        // Update help text
        updateHelpText(stockValue);
    }
}

function validateMaxOrder(maxOrderField) {
    const stockField = document.getElementById('id_stock_quantity');
    if (!stockField) return;
    
    const stockValue = parseInt(stockField.value);
    const maxValue = parseInt(maxOrderField.value);
    
    if (!isNaN(stockValue) && !isNaN(maxValue) && maxValue > stockValue) {
        alert(`Maximum order cannot exceed available stock (${stockValue}). Setting to ${stockValue}.`);
        maxOrderField.value = stockValue;
        maxOrderField.style.backgroundColor = '#fff3cd';
        setTimeout(() => {
            maxOrderField.style.backgroundColor = '';
        }, 2000);
    }
}

function updateHelpText(stockValue) {
    const helpTextElement = document.querySelector('.field-max_order .help');
    if (helpTextElement) {
        helpTextElement.innerHTML = `Maximum units per order. Cannot exceed stock quantity (${stockValue}).`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const stockField = document.getElementById('id_stock_quantity');
    const maxOrderField = document.getElementById('id_max_order');
    
    if (stockField && maxOrderField) {
        // Set initial max_order to match stock
        const stockValue = parseInt(stockField.value);
        if (!isNaN(stockValue)) {
            const currentMax = parseInt(maxOrderField.value);
            if (isNaN(currentMax) || currentMax > stockValue) {
                maxOrderField.value = stockValue;
            }
            updateHelpText(stockValue);
        }
        
        // Add event listeners
        stockField.addEventListener('change', function() {
            updateMaxOrderToStock(this);
        });
        stockField.addEventListener('input', function() {
            updateMaxOrderToStock(this);
        });
    }
});