document.addEventListener('DOMContentLoaded', function() {
    // Load equipment sets when the page loads
    loadEquipmentSets();
    
    // Add event listeners for search functionality
    const setSearch = document.getElementById('set-search');
    if (setSearch) {
        setSearch.addEventListener('input', filterEquipmentSets);
    }
});

// Function to load equipment sets from the server
async function loadEquipmentSets() {
    const container = document.getElementById('equipment-sets-container');
    if (!container) {
        console.error('Could not find equipment-sets-container element');
        return;
    }

    try {
        console.log('Fetching equipment sets from server...');
        const response = await fetch('/deRoute/getEquipmentSets');
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server responded with status:', response.status, errorText);
            throw new Error(`Server error: ${response.status} ${errorText}`);
        }
        
        const equipmentSets = await response.json();
        console.log('Received equipment sets:', equipmentSets);
        
        if (!Array.isArray(equipmentSets)) {
            throw new Error('Invalid response format: expected an array of equipment sets');
        }
        
        // Render the equipment sets in the UI
        renderEquipmentSets(equipmentSets);
    } catch (error) {
        console.error('Error loading equipment sets:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error Loading Equipment Sets</h5>
                <p>${error.message || 'An unknown error occurred'}</p>
                <button class="btn btn-sm btn-outline-primary" onclick="loadEquipmentSets()">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        `;
    }
}

// Function to render equipment sets in the UI
function renderEquipmentSets(equipmentSets) {
    const setsContainer = document.getElementById('equipment-sets-container');
    if (!setsContainer) return;
    
    // Clear existing content
    setsContainer.innerHTML = '';
    
    if (equipmentSets.length === 0) {
        setsContainer.innerHTML = '<p class="text-muted">No equipment sets found.</p>';
        return;
    }
    
    // Create a row for the grid
    const row = document.createElement('div');
    row.className = 'equipment-grid';
    
    // Add each equipment set to the grid
    equipmentSets.forEach(set => {
        const setElement = createEquipmentSetElement(set);
        row.appendChild(setElement);
    });
    
    setsContainer.appendChild(row);
}

// Function to create an equipment set element
function createEquipmentSetElement(set) {
    const setElement = document.createElement('div');
    setElement.className = 'card mb-3';
    setElement.dataset.id = set._id;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const titleRow = document.createElement('div');
    titleRow.className = 'd-flex justify-content-between align-items-center mb-2';
    
    const setName = document.createElement('h6');
    setName.className = 'card-title mb-0';
    setName.textContent = set.set_name || 'Unnamed Set';
    
    // Add edit and delete buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'btn-group btn-group-sm';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-outline-primary';
    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
    editBtn.title = 'Edit';
    editBtn.onclick = (e) => { e.stopPropagation(); editEquipmentSet(set); };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = (e) => { e.stopPropagation(); deleteEquipmentSet(set._id); };
    
    // Add buttons to button group
    buttonGroup.appendChild(editBtn);
    buttonGroup.appendChild(deleteBtn);
    
    // Add elements to title row
    titleRow.appendChild(setName);
    titleRow.appendChild(buttonGroup);
    
    // Create slots grid
    const slotsGrid = document.createElement('div');
    slotsGrid.className = 'equipment-set-slots';
    
    // Define slots in the order we want to display them
    const slots = [
        'head', 'cape', 'neck', 'ammunition',
        'left_hand', 'torso', 'right_hand',
        'legs',
        'hands', 'feet', 'jewelry'
    ];
    
    slots.forEach(slot => {
        if (!set[slot]) return;
        
        const slotItem = document.createElement('div');
        slotItem.className = 'equipment-set-slot';
        slotItem.title = slot.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const slotImg = document.createElement('img');
        slotImg.alt = slot;
        slotImg.loading = 'lazy';
        
        // Set the image source with error handling
        const setItem = set[slot];
        if (setItem) {
            // Try multiple possible image paths
            const imagePaths = [
                `/images/equipment/${setItem}.png`,
                `/images/items/${setItem}.png`,
                setItem.startsWith('http') ? setItem : null,
                setItem // In case the path is already complete
            ].filter(Boolean);
            
            // Function to try next image path
            const tryNextImage = (index = 0) => {
                if (index >= imagePaths.length) {
                    slotImg.src = '/images/Bank_filler.png';
                    return;
                }
                
                const img = new Image();
                img.onload = () => {
                    slotImg.src = imagePaths[index];
                };
                img.onerror = () => {
                    tryNextImage(index + 1);
                };
                img.src = imagePaths[index];
            };
            
            tryNextImage();
        } else {
            slotImg.src = '/images/Bank_filler.png';
        }
        
        slotItem.appendChild(slotImg);
        slotsGrid.appendChild(slotItem);
    });
    
    // Add edit and delete buttons to button group
    buttonGroup.appendChild(editBtn);
    buttonGroup.appendChild(deleteBtn);
    
    // Add elements to title row
    titleRow.appendChild(setName);
    titleRow.appendChild(buttonGroup);
    
    // Create footer with load button
    const footer = document.createElement('div');
    footer.className = 'card-footer bg-transparent border-top-0';
    
    const loadButton = document.createElement('button');
    loadButton.className = 'btn btn-sm btn-primary w-100';
    loadButton.innerHTML = '<i class="bi bi-arrow-left-circle me-1"></i> Load to Builder';
    loadButton.onclick = (e) => {
        e.stopPropagation();
        loadSetToBuilder(set);
    };
    
    footer.appendChild(loadButton);
    
    // Assemble the card
    cardBody.appendChild(titleRow);
    cardBody.appendChild(slotsGrid);
    cardBody.appendChild(footer);
    setElement.appendChild(cardBody);
    
    // Add click handler to select the set
    setElement.style.cursor = 'pointer';
    setElement.onclick = () => selectEquipmentSet(set);
    
    return setElement;
}

// Function to filter equipment sets based on search input
function filterEquipmentSets() {
    const searchTerm = this.value.toLowerCase();
    const setItems = document.querySelectorAll('.equipment-set-card');
    
    setItems.forEach(item => {
        const setName = item.querySelector('.equipment-set-name').textContent.toLowerCase();
        if (setName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Function to handle editing an equipment set
function editEquipmentSet(set) {
    // Implement edit functionality here
    console.log('Edit set:', set);
    // You can open a modal or navigate to an edit page
    // For now, we'll just log it to the console
}

// Function to handle selecting an equipment set
function selectEquipmentSet(set) {
    // Remove active class from all set elements
    document.querySelectorAll('.equipment-set-card').forEach(el => {
        el.classList.remove('border-primary');
    });
    
    // Add active class to selected set
    const selectedElement = document.querySelector(`.equipment-set-card[data-id="${set._id}"]`);
    if (selectedElement) {
        selectedElement.classList.add('border-primary');
    }
    
    // Here you can add logic to show the selected set's details
    // For example, you might want to highlight it or show more details
    console.log('Selected set:', set);
}

// Function to handle deleting an equipment set
async function deleteEquipmentSet(setId) {
    if (!confirm('Are you sure you want to delete this equipment set? This action cannot be undone.')) {
        return;
    }
    
    fetch(`/deRoute/deleteEquipmentSet/${setId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete equipment set');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Remove the set from the UI
            const setElement = document.querySelector(`[data-id="${setId}"]`);
            if (setElement) {
                setElement.remove();
            }
            
            // Show success message
            alert('Equipment set deleted successfully');
        } else {
            throw new Error(data.message || 'Failed to delete equipment set');
        }
    })
    .catch(error => {
        console.error('Error deleting equipment set:', error);
        alert(`Error: ${error.message}`);
    });
}

// Function to load an equipment set into the builder
function loadSetToBuilder(set) {
    if (!set) return;
    
    // Update each slot in the builder
    const slots = ['head', 'cape', 'neck', 'ammunition', 'torso', 'left_hand', 'right_hand', 'legs', 'hands', 'feet', 'jewelry'];
    
    slots.forEach(slot => {
        const imgElement = document.getElementById(`${slot}-img`);
        if (imgElement && set[slot]) {
            // Find the correct image path
            const setItem = set[slot];
            const imagePaths = [
                `/images/equipment/${setItem}.png`,
                `/images/items/${setItem}.png`,
                setItem.startsWith('http') ? setItem : null,
                setItem // In case the path is already complete
            ].filter(Boolean);
            
            // Store the item name in a data attribute
            imgElement.dataset.itemName = setItem;
            
            // Function to try next image path
            const tryNextImage = (index = 0) => {
                if (index >= imagePaths.length) {
                    imgElement.src = '/images/Bank_filler.png';
                    return;
                }
                
                const img = new Image();
                img.onload = () => {
                    imgElement.src = imagePaths[index];
                };
                img.onerror = () => {
                    tryNextImage(index + 1);
                };
                img.src = imagePaths[index];
            };
            
            tryNextImage();
        } else if (imgElement) {
            // Clear the slot if no item in this slot
            imgElement.src = '/images/Bank_filler.png';
            imgElement.removeAttribute('data-item-name');
        }
    });
    
    // Show a success message
    const toast = new bootstrap.Toast(document.getElementById('toast'));
    const toastBody = document.querySelector('#toast .toast-body');
    toastBody.textContent = `Loaded "${set.set_name || 'Unnamed Set'}" to builder`;
    toast.show();
    
    // Hide the toast after 3 seconds
    setTimeout(() => {
        toast.hide();
    }, 3000);
}
