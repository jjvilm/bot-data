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

// Helper function to format item name (capitalize first letter of first word, keep rest lowercase, and replace spaces with underscores)
function formatItemName(itemName) {
    if (!itemName) return '';
    
    // Convert to lowercase
    const lowerName = itemName.toLowerCase();
    
    // Capitalize first letter of the entire string
    if (lowerName.length === 0) return '';
    
    const firstChar = lowerName.charAt(0).toUpperCase();
    const restOfString = lowerName.slice(1);
    
    // Replace all spaces with underscores in the result
    return (firstChar + restOfString).replace(/ /g, '_');
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

// Function to clear all equipment slots
window.clearAllSlots = function() {
    
    
    console.log('clearAllSlots function called');
    
    // Define all equipment slots
    const slots = [
        'head', 'cape', 'neck', 'ammunition', 'torso', 
        'left_hand', 'right_hand', 'legs', 'hands', 'feet', 'jewelry'
    ];
    
    // Process each slot
    slots.forEach(slot => {
        const imgElement = document.getElementById(`${slot}-img`);
        const inputElement = document.getElementById(slot);
        
        console.log(`Processing slot: ${slot}`, { imgElement, inputElement });
        
        // Reset the image source to default
        if (imgElement) {
            imgElement.src = '/images/Bank_filler.png';
            imgElement.style.opacity = '1';
            imgElement.style.filter = 'none';
            console.log(`Reset image for slot: ${slot}`);
            
            // Remove any stored item name
            imgElement.removeAttribute('data-item-name');
        } else {
            console.warn(`Image element not found for slot: ${slot}`);
        }
        
        // Clear the corresponding input field
        if (inputElement) {
            inputElement.value = '';
            console.log(`Cleared input for slot: ${slot}`);
        } else {
            console.warn(`Input element not found for slot: ${slot}`);
        }
    });
    
    showToast('All equipment slots have been cleared', 'success');
    console.log('clearAllSlots function completed');
    
    // Force a reflow to ensure the DOM updates
    document.body.offsetHeight;
};

// Function to handle slot left clicks
async function handleSlotLeftClick(event) {
    event.stopPropagation();
    event.preventDefault();
    
    const slot = event.currentTarget;
    const slotName = slot.getAttribute('data-slot');
    const imgElement = document.getElementById(`${slotName}-img`);
    
    const itemName = prompt(`Enter item name for ${slotName.replace('_', ' ')}:`);
    if (!itemName || !itemName.trim()) return;
    
    // Format the item name (capitalize first letter, replace spaces with underscores)
    const formattedName = formatItemName(itemName);
    const wikiImageUrl = `https://oldschool.runescape.wiki/images/${formattedName}.png`;
    const cacheKey = `equip-${formattedName}`;
    
    console.log(`Looking up item: ${formattedName}`);
    
    // Check local storage first
    const cachedImage = getCachedImage(cacheKey);
    if (cachedImage) {
        console.log('Found in cache');
        imgElement.src = cachedImage;
        imgElement.setAttribute('data-item-name', formattedName);
        showToast(`Set ${slotName} to ${formattedName.replace(/_/g, ' ')}`, 'success');
        return;
    }
    
    // If not in cache, try to load from OSRS Wiki
    showToast(`Fetching image for ${formattedName}...`, 'info');
    
    try {
        // Check if image exists on wiki
        const imageExists = await checkImageExists(wikiImageUrl);
        if (imageExists) {
            // Cache the image for future use
            await cacheImage(cacheKey, wikiImageUrl);
            
            // Update the image source
            imgElement.src = wikiImageUrl;
            imgElement.setAttribute('data-item-name', formattedName);
            showToast(`Set ${slotName} to ${formattedName.replace(/_/g, ' ')}`, 'success');
        } else {
            throw new Error('Image not found on wiki');
        }
    } catch (error) {
        console.error('Error loading image:', error);
        showToast(`Could not find image for: ${formattedName.replace(/_/g, ' ')}`, 'warning');
    }
}

// Function to handle slot right clicks
function handleSlotRightClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const slot = event.currentTarget;
    const slotName = slot.getAttribute('data-slot');
    const imgElement = document.getElementById(`${slotName}-img`);
    
    imgElement.src = '/images/Bank_filler.png';
    imgElement.removeAttribute('data-item-name');
    showToast(`Reset ${slotName} to default`, 'info');
    
    return false;
}

// Initialize equipment builder slots
function initEquipmentBuilder() {
    const slots = document.querySelectorAll('.equipment-slot');
    slots.forEach(slot => {
        // Clear any existing event listeners by cloning the element
        const newSlot = slot.cloneNode(true);
        slot.parentNode.replaceChild(newSlot, slot);
        
        // Add new event listeners
        newSlot.addEventListener('click', handleSlotLeftClick);
        newSlot.addEventListener('contextmenu', handleSlotRightClick);
    });
    
    // Fix for Clear All button
    const clearButton = document.querySelector('[onclick*="clearAllSlots"]');
    if (clearButton) {
        const newButton = clearButton.cloneNode(true);
        clearButton.parentNode.replaceChild(newButton, clearButton);
        newButton.onclick = clearAllSlots;
    }
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Function to handle bot search
async function searchBots(searchTerm) {
    const resultsContainer = document.getElementById('bot-search-results');
    
    if (!searchTerm || searchTerm.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`/deRoute/api/search-bots?q=${encodeURIComponent(searchTerm)}`);
        const bots = await response.json();
        
        if (!Array.isArray(bots)) {
            console.error('Invalid response format from server');
            return;
        }
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        if (bots.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-2 text-muted';
            noResults.textContent = 'No bots found';
            resultsContainer.appendChild(noResults);
        } else {
            bots.forEach(bot => {
                const botElement = document.createElement('div');
                botElement.className = 'p-2 border-bottom hover-bg-light cursor-pointer';
                botElement.style.cursor = 'pointer';
                
                // Display bot name and alias if available
                const displayText = bot.alias 
                    ? `${bot.bot_name} (${bot.alias}) - Lvl ${bot.combat_lv || '?'}`
                    : `${bot.bot_name} - Lvl ${bot.combat_lv || '?'}`;
                
                botElement.textContent = displayText;
                
                // Add click handler to select the bot
                botElement.addEventListener('click', () => {
                    const botSearch = document.getElementById('bot-search');
                    const botSelect = document.getElementById('bot-select');
                    const setSelect = document.getElementById('set-select');
                    
                    // Update the search input with the selected bot's display text
                    botSearch.value = displayText;
                    
                    // Clear any existing options
                    while (botSelect.options.length > 0) {
                        botSelect.remove(0);
                    }
                    
                    // Create and add the selected bot as an option
                    const option = document.createElement('option');
                    option.value = bot._id;
                    option.text = displayText;
                    option.selected = true;
                    botSelect.add(option);
                    
                    // Force a change event to ensure the value is set
                    const event = new Event('change');
                    botSelect.dispatchEvent(event);
                    
                    // Log the selection for debugging
                    // console.log('Bot selected:', { 
                    //     displayText, 
                    //     botId: bot._id,
                    //     botSelectValue: botSelect.value,
                    //     options: Array.from(botSelect.options).map(opt => ({
                    //         value: opt.value,
                    //         text: opt.text,
                    //         selected: opt.selected
                    //     }))
                    // });
                    
                    // Hide the results dropdown
                    resultsContainer.style.display = 'none';
                    
                    // Enable the set select if it was disabled
                    if (setSelect && setSelect.disabled) {
                        setSelect.disabled = false;
                    }
                    
                    // Enable the apply button if both bot and set are selected
                    updateApplyButtonState();
                });
                
                resultsContainer.appendChild(botElement);
            });
        }
        
        resultsContainer.style.display = 'block';
    } catch (error) {
        console.error('Error searching bots:', error);
        resultsContainer.style.display = 'none';
    }
}

// Function to update the apply button state
function updateApplyButtonState() {
    const botSelect = document.getElementById('bot-select');
    const setSelect = document.getElementById('set-select');
    const applyButton = document.getElementById('apply-button');
    
    if (botSelect && setSelect && applyButton) {
        applyButton.disabled = !(botSelect.value && setSelect.value);
        // console.log('Apply button state updated:', {
        //     disabled: applyButton.disabled,
        //     botSelectValue: botSelect.value,
        //     setSelectValue: setSelect.value
        // });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Clear old caches on load
    clearOldCaches();
    
    // Initialize equipment builder
    initEquipmentBuilder();
    
    // Load equipment sets when the page loads
    loadEquipmentSets();
    
    // Add event listeners for equipment set search
    const setSearch = document.getElementById('set-search');
    if (setSearch) {
        setSearch.addEventListener('input', filterEquipmentSets);
    }
    
    // Add event listeners for bot search
    const botSearch = document.getElementById('bot-search');
    const botSearchResults = document.getElementById('bot-search-results');
    
    if (botSearch) {
        // Debounce the search to avoid excessive API calls
        const debouncedSearch = debounce((e) => {
            searchBots(e.target.value);
        }, 300);
        
        botSearch.addEventListener('input', debouncedSearch);
        
        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== botSearch && e.target !== botSearchResults) {
                botSearchResults.style.display = 'none';
            }
        });
    }
    
    // Update apply button state when set is selected
    const setSelect = document.getElementById('set-select');
    if (setSelect) {
        setSelect.addEventListener('change', updateApplyButtonState);
    }
    
    // Add event listener for the apply button
    const applyButton = document.getElementById('apply-button');
    
    if (applyButton) {
        applyButton.addEventListener('click', function(e) {
            // console.log('Apply button clicked!', e);
            e.preventDefault();
            e.stopPropagation();
            applyEquipmentSetToBot();
        });
        
        // Make sure the button is visible and clickable
        applyButton.style.pointerEvents = 'auto';
        applyButton.style.position = 'relative';
        applyButton.style.zIndex = '1000';
        // console.log('Apply button event listener added');
    } else {
        console.error('Apply button not found in DOM');
    }
});

// Function to load equipment sets from the server
async function loadEquipmentSets() {
    const container = document.getElementById('equipment-sets-container');
    if (!container) {
        // console.error('Could not find equipment-sets-container element');
        return;
    }

    try {
        // console.log('Fetching equipment sets from server...');
        const response = await fetch('/deRoute/getEquipmentSets');
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server responded with status:', response.status, errorText);
            throw new Error(`Server error: ${response.status} ${errorText}`);
        }
        
        const equipmentSets = await response.json();
        // console.log('Received equipment sets:', equipmentSets);
        
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

// Function to render equipment sets in the UI and populate the dropdown
function renderEquipmentSets(equipmentSets) {
    const setsContainer = document.getElementById('equipment-sets-container');
    const setSelect = document.getElementById('set-select');
    
    if (!setsContainer) return;
    
    // Clear existing content in both container and dropdown
    setsContainer.innerHTML = '';
    if (setSelect) {
        // Keep the first "Select a set..." option and remove the rest
        while (setSelect.options.length > 1) {
            setSelect.remove(1);
        }
    }
    
    if (equipmentSets.length === 0) {
        setsContainer.innerHTML = '<p class="text-muted">No equipment sets found.</p>';
        return;
    }
    
    // Create a row for the grid
    const row = document.createElement('div');
    row.className = 'equipment-grid';
    
    // Add each equipment set to the grid and dropdown
    equipmentSets.forEach(set => {
        const setElement = createEquipmentSetElement(set);
        row.appendChild(setElement);
        
        // Add to dropdown if it exists
        if (setSelect && set.set_name) {
            const option = document.createElement('option');
            option.value = set._id;
            option.textContent = set.set_name || `Unnamed Set (${set._id.substring(0, 6)}...)`;
            setSelect.appendChild(option);
        }
    });
    
    setsContainer.appendChild(row);
    
    // Enable the set select if it was disabled and we have sets
    if (setSelect && equipmentSets.length > 0) {
        setSelect.disabled = false;
    }
}

// Function to create an equipment set element
function createEquipmentSetElement(set) {
    const setElement = document.createElement('div');
    setElement.className = 'card mb-3 equipment-set-card';
    setElement.dataset.id = set._id;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body p-2';
    
    // Create header row with just the set name
    const headerRow = document.createElement('div');
    headerRow.className = 'd-flex justify-content-between align-items-center mb-2 p-1';
    headerRow.style.minHeight = '32px'; // Ensure consistent height
    
    const setName = document.createElement('h6');
    setName.className = 'card-title mb-0';
    setName.textContent = set.set_name || 'Unnamed Set';
    
    // Add set name to header row
    headerRow.appendChild(setName);
    
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
    
    // Create footer with buttons
    const footer = document.createElement('div');
    footer.className = 'card-footer bg-transparent border-top-0 px-1 py-1 d-flex flex-column gap-1';
    
    // Create load button (full width)
    const loadButton = document.createElement('button');
    loadButton.className = 'btn btn-primary w-100 py-0';
    loadButton.style.fontSize = '0.7rem';
    loadButton.style.lineHeight = '1.2';
    loadButton.innerHTML = '<i class="bi bi-arrow-left-circle" style="margin-right: 0.1rem; font-size: 0.8em; position: relative; top: -0.05em;"></i>Load to Builder';
    loadButton.onclick = (e) => {
        e.stopPropagation();
        loadSetToBuilder(set);
    };
    
    // Create button container for action buttons (edit/delete)
    const actionButtons = document.createElement('div');
    actionButtons.className = 'd-flex w-100 gap-1';
    
    // Create edit button (half width)
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-outline-primary btn-sm flex-fill py-0';
    editBtn.style.fontSize = '0.65rem';
    editBtn.style.lineHeight = '1.1';
    editBtn.style.padding = '0.15rem 0.3rem';
    editBtn.innerHTML = '<i class="bi bi-pencil" style="margin-right: 0.02rem; font-size: 0.8em; position: relative; top: -0.05em;"></i>Edit';
    editBtn.title = 'Edit';
    editBtn.onclick = (e) => { e.stopPropagation(); editEquipmentSet(set); };
    
    // Create delete button (half width)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger btn-sm flex-fill py-0';
    deleteBtn.style.fontSize = '0.65rem';
    deleteBtn.style.lineHeight = '1.1';
    deleteBtn.style.padding = '0.15rem 0.3rem';
    deleteBtn.innerHTML = '<i class="bi bi-trash" style="margin-right: 0.05rem; font-size: 0.8em; position: relative; top: -0.05em;"></i>Delete';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = (e) => { e.stopPropagation(); deleteEquipmentSet(set._id); };
    
    // Add buttons to action container
    actionButtons.appendChild(editBtn);
    actionButtons.appendChild(deleteBtn);
    
    // Add elements to footer
    footer.appendChild(loadButton);
    footer.appendChild(actionButtons);
    
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
        const nameElement = item.querySelector('.card-title');
        if (nameElement) {
            const setName = nameElement.textContent.toLowerCase();
            if (setName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } else {
            // If no name element is found, show the item to prevent hiding everything
            console.warn('Equipment set name element not found in card:', item);
            item.style.display = 'flex';
        }
    });
}

// Function to handle editing an equipment set
function editEquipmentSet(set) {
    // Set the set ID and name
    const nameInput = document.getElementById('edit_set_name');
    document.getElementById('edit_set_id').value = set._id;
    nameInput.value = set.set_name;
    nameInput.setAttribute('data-original-name', set.set_name);
    
    // Clear all input fields first and store original values
    const slots = ['head', 'cape', 'neck', 'ammunition', 'torso', 'left_hand', 'right_hand', 'legs', 'hands', 'feet', 'jewelry'];
    slots.forEach(slot => {
        const input = document.getElementById(`edit_${slot}`);
        if (input) {
            input.value = '';
            input.removeAttribute('data-original-value');
        }
    });
    
    // Set the values from the set and store original values
    Object.entries(set).forEach(([key, value]) => {
        if (key === '_id' || key === 'set_name') return;
        const input = document.getElementById(`edit_${key}`);
        if (input && value) {
            input.value = value;
            // Store the original value for change detection
            input.setAttribute('data-original-value', value);
        }
    });
    
    // Show the modal
    const editModal = new bootstrap.Modal(document.getElementById('editSetModal'));
    editModal.show();
}

// Function to update an equipment set
async function updateEquipmentSet() {
    const saveButton = document.querySelector('#editSetModal .btn-primary');
    const originalButtonText = saveButton.innerHTML;
    
    try {
        const setId = document.getElementById('edit_set_id').value;
        const originalSetName = document.getElementById('edit_set_name').getAttribute('data-original-name');
        const currentSetName = document.getElementById('edit_set_name').value.trim();
        
        if (!currentSetName) {
            showToast('Please enter a name for the equipment set', 'error');
            return;
        }
        
        // Show loading state
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Collect equipment data with formatted item names
        const equipmentData = {};
        const slots = ['head', 'cape', 'neck', 'ammunition', 'torso', 'left_hand', 'right_hand', 'legs', 'hands', 'feet', 'jewelry'];
        
        // Verify only new or changed items
        for (const slot of slots) {
            const input = document.getElementById(`edit_${slot}`);
            if (input) {
                const originalValue = input.getAttribute('data-original-value') || '';
                const currentValue = input.value.trim();
                
                // Skip if the value hasn't changed
                if (currentValue === originalValue) {
                    equipmentData[slot] = originalValue;
                    continue;
                }
                
                // Process new or changed items
                if (currentValue) {
                    let itemName = currentValue;
                    
                    // Extract item name if it's a URL
                    if (itemName.includes('://')) {
                        itemName = extractItemNameFromUrl(itemName);
                    }
                    
                    // Format the item name (capitalize first letter only)
                    const formattedName = formatItemName(itemName);
                    
                    // Only verify image for new/changed items
                    const imageUrl = `https://oldschool.runescape.wiki/images/${formattedName}.png`;
                    const imageExists = await checkImageExists(imageUrl);
                    
                    if (!imageExists) {
                        throw new Error(`Could not verify image for ${formattedName.replace(/_/g, ' ')}`);
                    }
                    
                    equipmentData[slot] = formattedName;
                } else {
                    equipmentData[slot] = '';
                }
            }
        }
        
        // If we get here, all images are valid - proceed with update
        const response = await fetch(`/deRoute/updateEquipmentSet/${setId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                set_name: currentSetName,
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
    } finally {
        // Reset button state
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = originalButtonText;
        }
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
    // console.log('Selected set:', set);
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

// Function to apply an equipment set to a bot
async function applyEquipmentSetToBot() {
    // console.log('applyEquipmentSetToBot called');
    
    const botSelect = document.getElementById('bot-select');
    const setSelect = document.getElementById('set-select');
    const applyButton = document.getElementById('apply-button');
    const botSearch = document.getElementById('bot-search');
    
    // console.log('Elements:', { 
    //     botSelect: botSelect ? {
    //         exists: true,
    //         value: botSelect.value,
    //         options: Array.from(botSelect.options).map(opt => ({
    //             value: opt.value,
    //             text: opt.text,
    //             selected: opt.selected
    //         }))
    //     } : false, 
    //     setSelect: setSelect ? {
    //         exists: true,
    //         value: setSelect.value,
    //         options: Array.from(setSelect.options).map(opt => ({
    //             value: opt.value,
    //             text: opt.text,
    //             selected: opt.selected
    //         }))
    //     } : false,
    //     applyButton: !!applyButton,
    //     botSearch: botSearch ? {
    //         exists: true,
    //         value: botSearch.value
    //     } : false
    // });
    
    if (!botSelect || !setSelect || !applyButton || !botSearch) {
        console.error('Missing required elements');
        return;
    }
    
    // Get the bot ID from the hidden select element
    const botId = botSelect.value;
    const setId = setSelect.value;
    // Extract just the bot name from the display text (remove level and other info)
    const botName = botSearch.value.split(' (')[0].trim();
    
    // console.log('Values:', { 
    //     botId, 
    //     setId, 
    //     botName,
    //     botSearchValue: botSearch.value,
    //     currentTime: new Date().toISOString()
    // });
    
    if (!botId || !setId) {
        const errorMsg = !botId ? 'No bot selected' : 'No equipment set selected';
        console.error('Validation failed:', errorMsg, { 
            hasBotId: !!botId, 
            hasSetId: !!setId,
            botSelectValue: botSelect.value,
            setSelectValue: setSelect.value
        });
        showToast(`Please select both a bot and an equipment set (${errorMsg})`, 'error');
        return;
    }
    
    try {
        // Disable the button to prevent multiple clicks
        applyButton.disabled = true;
        applyButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Applying...';
        
        const requestBody = {
            botId: botId,
            equipmentSetId: setId
        };
        
        // console.log('Sending request to /deRoute/api/apply-equipment-set with:', requestBody);
        
        const response = await fetch('/deRoute/api/apply-equipment-set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            credentials: 'same-origin' // Ensure cookies are sent with the request
        });
        
        // console.log('Response status:', response.status);
        
        let responseData;
        try {
            responseData = await response.json();
            // console.log('Response data:', responseData);
        } catch (error) {
            console.error('Error parsing JSON response:', error);
            throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
            console.error('Server error:', responseData);
            throw new Error(responseData.message || 'Failed to apply equipment set');
        }
        
        // Show success message
        // console.log(`Equipment set applied to ${botName} successfully!`);
        showToast(`Successfully applied equipment set to ${botName}`, 'success');
        
        // Reset the form
        document.getElementById('bot-search').value = '';
        document.getElementById('bot-select').value = '';
        document.getElementById('set-select').value = '';
        document.getElementById('apply-button').disabled = true;
        updateApplyButtonState();
    } catch (error) {
        console.error('Error applying equipment set:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        // Re-enable the apply button
        if (applyButton) {
            applyButton.disabled = false;
            applyButton.innerHTML = '<i class="bi bi-check-circle me-1"></i> Apply';
        }
    }
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
