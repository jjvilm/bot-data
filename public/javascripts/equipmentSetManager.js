// Cache expiration time (7 days in milliseconds)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if an image exists at the given URL
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - True if the image exists and is accessible
 */
async function checkImageExists(url) {
    try {
        if (!url) return false;
        
        // Skip data URLs (already in base64)
        if (url.startsWith('data:')) return true;
        
        // For relative paths, make sure they're absolute
        const fullUrl = url.startsWith('http') ? url : new URL(url, window.location.origin).toString();
        
        const response = await fetch(fullUrl, { method: 'HEAD', cache: 'no-cache' });
        return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (e) {
        return false;
    }
}

/**
 * Get an image from localStorage if it exists and isn't expired
 * @param {string} key - The cache key
 * @returns {string|null} - The cached image data URL or null if not found or expired
 */
function getCachedImage(key) {
    try {
        const cacheKey = `img_${key}`;
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_EXPIRATION) {
            localStorage.removeItem(cacheKey); // Remove expired cache
            return null;
        }
        return data;
    } catch (e) {
        console.error('Error reading from cache:', e);
        return null;
    }
}

// Function to extract item name from URL (for backward compatibility)
function extractItemNameFromUrl(url) {
    if (!url) return '';
    try {
        // If it's not a URL, return as is
        if (!url.includes('://')) return url;
        
        // Extract the last part of the URL path
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        let filename = pathParts[pathParts.length - 1];
        
        // Remove file extension if present
        const dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0) {
            filename = filename.substring(0, dotIndex);
        }
        
        return filename;
    } catch (e) {
        console.error('Error parsing URL:', e);
        return url; // Return original if parsing fails
    }
}

/**
 * Save an image to localStorage
 * @param {string} key - The cache key (usually the image URL or item ID)
 * @param {string} url - The image URL to cache
 * @returns {Promise<void>}
 */
async function cacheImage(key, url) {
    try {
        // Skip if already in cache
        if (getCachedImage(key)) return;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        
        const blob = await response.blob();
        const reader = new FileReader();
        
        return new Promise((resolve) => {
            reader.onload = () => {
                try {
                    const cacheKey = `img_${key}`;
                    const cacheData = {
                        data: reader.result,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                    resolve();
                } catch (e) {
                    console.error('Error saving to cache:', e);
                    // If we hit storage limits, clear old caches
                    if (e.name === 'QuotaExceededError') {
                        clearOldCaches();
                    }
                    resolve(); // Don't fail the whole operation
                }
            };
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error('Error caching image:', e);
    }
}

/**
 * Clear caches older than the expiration time
 */
function clearOldCaches() {
    const now = Date.now();
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('img_')) {
            try {
                const { timestamp } = JSON.parse(localStorage.getItem(key));
                if (now - timestamp > CACHE_EXPIRATION) {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                // If we can't parse the cache entry, remove it
                localStorage.removeItem(key);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Clear old caches on load
    clearOldCaches();
    
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
    setElement.className = 'card mb-3 equipment-set-card';
    setElement.dataset.id = set._id;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body p-2';
    
    // Create header row with flex layout
    const headerRow = document.createElement('div');
    headerRow.className = 'd-flex justify-content-between align-items-center mb-2 p-1';
    headerRow.style.minHeight = '32px'; // Ensure consistent height
    
    const setName = document.createElement('h6');
    setName.className = 'card-title mb-0';
    setName.textContent = set.set_name || 'Unnamed Set';
    
    // Add edit and delete buttons
    // Create button container with flex layout
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex gap-1';
    
    // Create edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary p-1';
    editBtn.style.width = '24px';
    editBtn.style.height = '24px';
    editBtn.style.display = 'flex';
    editBtn.style.alignItems = 'center';
    editBtn.style.justifyContent = 'center';
    editBtn.innerHTML = '<i class="bi bi-pencil" style="font-size: 0.75rem;"></i>';
    editBtn.title = 'Edit';
    editBtn.onclick = (e) => { e.stopPropagation(); editEquipmentSet(set); };
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger p-1';
    deleteBtn.style.width = '24px';
    deleteBtn.style.height = '24px';
    deleteBtn.style.display = 'flex';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.innerHTML = '<i class="bi bi-trash" style="font-size: 0.75rem;"></i>';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = (e) => { e.stopPropagation(); deleteEquipmentSet(set._id); };
    
    // Add buttons to container
    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(deleteBtn);
    
    // Add elements to header row
    headerRow.appendChild(setName);
    headerRow.appendChild(buttonContainer);
    
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
            // Check if it's a full URL or just an item name
            let imageUrl;
            if (setItem.startsWith('http')) {
                // Handle full URL (for backward compatibility)
                imageUrl = setItem;
            } else {
                // Construct URL from item name
                imageUrl = `https://oldschool.runescape.wiki/images/${setItem}.png`;
            }
            
            // First, try to get image from cache
            const cacheKey = `equipment-image-${setItem}`;
            const cachedImage = getCachedImage(cacheKey);
            
            if (cachedImage) {
                slotImg.src = cachedImage;
                slotImg.setAttribute('data-item-name', setItem);
            } else {
                // If not in cache, try to load from network
                const img = new Image();
                img.onload = async () => {
                    slotImg.src = imageUrl;
                    slotImg.setAttribute('data-item-name', setItem);
                    // Cache the successful image
                    await cacheImage(cacheKey, imageUrl).catch(console.error);
                };
                img.onerror = () => {
                    console.error(`Failed to load image for item: ${setItem}`);
                    slotImg.src = '/images/Bank_filler.png';
                };
                img.src = imageUrl;
            }
        } else {
            slotImg.src = '/images/Bank_filler.png';
        }
        
        slotItem.appendChild(slotImg);
        slotsGrid.appendChild(slotItem);
    });
    
    // Note: Buttons are already added to buttonContainer and headerRow above
    // No need to append them again here
    
    // Create footer with load button
    const footer = document.createElement('div');
    footer.className = 'card-footer bg-transparent border-top-0';
    
    const loadButton = document.createElement('button');
    loadButton.className = 'load-set-btn w-100';
    loadButton.innerHTML = '<i class="bi bi-arrow-left-circle"></i> Load to Builder';
    loadButton.onclick = (e) => {
        e.stopPropagation();
        loadSetToBuilder(set);
    };
    
    footer.appendChild(loadButton);
    
    // Add elements to card body
    cardBody.appendChild(headerRow);
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
    if (!set) return;
    
    // Set the set ID in the hidden field
    document.getElementById('edit_set_id').value = set._id;
    
    // Set the set name
    document.getElementById('edit_set_name').value = set.set_name || '';
    
    // Set equipment slot values
    const slots = ['head', 'cape', 'neck', 'ammunition', 'torso', 'left_hand', 'right_hand', 'legs', 'hands', 'feet', 'jewelry'];
    slots.forEach(slot => {
        const input = document.getElementById(`edit_${slot}`);
        if (input && set[slot]) {
            input.value = set[slot];
        } else if (input) {
            input.value = '';
        }
    });
    
    // Show the modal
    const editModal = new bootstrap.Modal(document.getElementById('editSetModal'));
    editModal.show();
}

// Function to update an equipment set
async function updateEquipmentSet() {
    const setId = document.getElementById('edit_set_id').value;
    const setName = document.getElementById('edit_set_name').value.trim();
    
    if (!setName) {
        showToast('Please enter a name for the equipment set', 'error');
        return;
    }
    
    // Collect equipment data with just item names
    const equipmentData = {};
    const slots = ['head', 'cape', 'neck', 'ammunition', 'torso', 'left_hand', 'right_hand', 'legs', 'hands', 'feet', 'jewelry'];
    
    for (const slot of slots) {
        const input = document.getElementById(`edit_${slot}`);
        if (input) {
            const value = input.value.trim();
            // Extract just the item name if it's a full URL
            equipmentData[slot] = value.includes('://') ? extractItemNameFromUrl(value) : value;
        }
    }
    
    try {
        const response = await fetch(`/deRoute/updateEquipmentSet/${setId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                set_name: setName,
                ...equipmentData
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to update equipment set');
        }
        
        // Close the modal
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editSetModal'));
        if (editModal) {
            editModal.hide();
        }
        
        // Reload the equipment sets to show the updated data
        loadEquipmentSets();
        
        // Show success message
        showToast('Equipment set updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating equipment set:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Helper function to show toast messages
function showToast(message, type = 'info') {
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        console.warn('Toast container not found');
        return;
    }
    
    // Define toast types and their corresponding Bootstrap classes
    const toastTypes = {
        success: {
            bgClass: 'bg-success text-white',
            icon: 'check-circle'
        },
        error: {
            bgClass: 'bg-danger text-white',
            icon: 'exclamation-triangle'
        },
        warning: {
            bgClass: 'bg-warning text-dark',
            icon: 'exclamation-triangle'
        },
        info: {
            bgClass: 'bg-info text-white',
            icon: 'info-circle'
        }
    };
    
    // Get the toast type or default to info
    const toastType = toastTypes[type] || toastTypes.info;
    
    // Create toast HTML
    const toastHtml = `
        <div id="${toastId}" class="toast show mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${toastType.bgClass} text-white">
                <i class="bi bi-${toastType.icon} me-2"></i>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Initialize and show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    
    // Remove the toast from DOM after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function () {
        toastElement.remove();
    });
    
    // Auto-hide after delay
    setTimeout(() => {
        if (toast && toast.hide) {
            toast.hide();
        }
    }, 5000);
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

// Function to start editing a set name
function startEditingSetName(set, nameElement, container, editNameBtn) {
    const currentName = nameElement.textContent;
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'equipment-set-name-input';
    input.value = currentName;
    input.maxLength = 30;
    
    // Create save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-sm btn-success ms-1';
    saveBtn.innerHTML = '<i class="bi bi-check"></i>';
    saveBtn.onclick = (e) => {
        e.stopPropagation();
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            updateSetName(set._id, newName, nameElement);
        }
        container.replaceChild(nameElement, input);
        container.removeChild(saveBtn);
        container.appendChild(nameElement);
        container.appendChild(editNameBtn);
    };
    
    // Handle Enter/Escape keys
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            saveBtn.click();
        } else if (e.key === 'Escape') {
            container.replaceChild(nameElement, input);
            container.removeChild(saveBtn);
            container.appendChild(nameElement);
            container.appendChild(editNameBtn);
        }
    };
    
    // Replace name with input field
    container.replaceChild(input, nameElement);
    container.insertBefore(saveBtn, container.firstChild.nextSibling);
    input.focus();
    input.select();
}

// Function to update set name via API
async function updateSetName(setId, newName, nameElement) {
    try {
        const response = await fetch(`/deRoute/updateEquipmentSetName/${setId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newName })
        });
        
        if (response.ok) {
            nameElement.textContent = newName;
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'toast align-items-center text-white bg-success border-0';
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        Set name updated successfully
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>`;
            document.body.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            toast.addEventListener('hidden.bs.toast', () => {
                document.body.removeChild(toast);
            });
        } else {
            throw new Error('Failed to update set name');
        }
    } catch (error) {
        console.error('Error updating set name:', error);
        alert('Failed to update set name. Please try again.');
    }
}

// Function to load an equipment set into the builder
async function loadSetToBuilder(set) {
    if (!set) return;
    
    // Update each slot in the builder
    const slots = ['head', 'cape', 'neck', 'ammunition', 'torso', 'left_hand', 'right_hand', 'legs', 'hands', 'feet', 'jewelry'];
    
    for (const slot of slots) {
        const imgElement = document.getElementById(`${slot}-img`);
        if (!imgElement) continue;
        
        const setItem = set[slot];
        if (!setItem) {
            // Clear the slot if no item in this slot
            imgElement.src = '/images/Bank_filler.png';
            imgElement.removeAttribute('data-item-name');
            imgElement.removeAttribute('data-item-url');
            continue;
        }
        
        // Determine if it's a full URL or just an item name
        let itemName, imageUrl;
        
        if (setItem.startsWith('http')) {
            // Handle full URL (for backward compatibility)
            itemName = extractItemNameFromUrl(setItem);
            imageUrl = setItem;
        } else {
            // It's just an item name
            itemName = setItem;
            imageUrl = `https://oldschool.runescape.wiki/images/${setItem}.png`;
        }
        
        // Store the item name in a data attribute
        imgElement.setAttribute('data-item-name', itemName);
        imgElement.setAttribute('data-item-url', imageUrl);
        
        // Show loading state
        imgElement.style.opacity = '0.7';
        
        // Try to get image from cache first
        const cacheKey = `equipment-image-${itemName}`;
        const cachedImage = getCachedImage(cacheKey);
        
        if (cachedImage) {
            // Use cached image if available
            imgElement.src = cachedImage;
            imgElement.style.opacity = '1';
            continue;
        }
        
        // If not in cache, load from network
        const img = new Image();
        img.onload = async () => {
            imgElement.src = imageUrl;
            imgElement.style.opacity = '1';
            // Cache the successful image
            await cacheImage(cacheKey, imageUrl).catch(console.error);
        };
        img.onerror = () => {
            console.error(`Failed to load image for item: ${itemName}`);
            imgElement.src = '/images/Bank_filler.png';
            imgElement.style.opacity = '1';
        };
        img.src = imageUrl;
    }
    
    // Show a success message
    try {
        const toast = new bootstrap.Toast(document.getElementById('toast'));
        const toastBody = document.querySelector('#toast .toast-body');
        if (toast && toastBody) {
            toastBody.textContent = `Loaded "${set.set_name || 'Unnamed Set'}" to builder`;
            toast.show();
            
            // Hide the toast after 3 seconds
            setTimeout(() => {
                toast.hide();
            }, 3000);
        }
    } catch (error) {
        console.error('Error showing toast:', error);
    }
}
