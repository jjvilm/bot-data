// Helper function to format numbers with K/M suffixes
function formatNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
}

// Helper function to calculate minutes since kill
function calculateMinutesSinceKill(killDate) {
    const now = new Date();
    const kill = new Date(killDate);
    const diffMinutes = Math.floor((now - kill) / (1000 * 60));
    return `${diffMinutes} min`;
}

document.addEventListener('DOMContentLoaded', function () {
    const rowColors = {}; // Object to store row colors by bot name
    const tableBody = document.querySelector('#week-kills-table tbody');

    // Set up EventSource for real-time updates
    let eventSource;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 seconds

    function setupEventSource() {
        if (eventSource) {
            console.log('Closing existing EventSource connection...');
            eventSource.close();
        }

        console.log('Setting up new EventSource...');
        eventSource = new EventSource('/deRoute/stream');

        eventSource.onopen = function() {
            console.log('SSE connection established');
            reconnectAttempts = 0;
            document.getElementById('connectionStatus').textContent = 'Connected';
            document.getElementById('connectionStatus').style.color = '#4CAF50';
        };

        eventSource.onmessage = async function(event) {
            try {
                console.log('Raw event data:', event.data);
                const data = JSON.parse(event.data);
                console.log('Parsed event data:', data);

                if (data.type === 'connected') {
                    console.log('Successfully connected to event stream');
                    return;
                }

                if (data.type === 'ping') {
                    console.log('Received ping');
                    return;
                }
                
                // Check if this is a bot hunt event
                if (data && typeof data === 'object' && data.bot_name) {
                    console.log('New bot hunt received:', data);
                    
                    // Create a new row for the bot
                    const newRow = `
                        <tr>
                            <td><a href="/deRoute/botKills?id=${data._id}">${data.bot_name} <br> (${data.combat_lv})</a>
                                <div id="equipment-images-${data._id}" class="equipment-grid"></div>
                                <span class="hunter-name">hunted by: <a href="/qcRoute/player-latest-bots?hunter_name=${data.most_recent_kill.hunter_name}">${data.most_recent_kill.hunter_name}</a></span>
                            </td>
                            <td><span style="font-size: larger;">${data.most_recent_kill.world_number}</span></td>
                            <td>${new Date(data.most_recent_kill.kill_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <br> ${calculateMinutesSinceKill(data.most_recent_kill.kill_date)} ago</td>
                            <td>${formatNumber(data.most_recent_kill.loot_amount)}</td>
                        </tr>
                    `;

                    // Insert at the beginning of the table
                    tableBody.insertAdjacentHTML('afterbegin', newRow);

                    // If equipment set exists, fetch and display it
                    if (data.equipment_set_name) {
                        fetchEquipmentSet(data._id, data.equipment_set_name);
                    }

                    // Update row colors
                    initializeRowColors();

                    // Hide no bots message if it was showing
                    const noBotsMessageContainer = document.getElementById('noBotsMessageContainer');
                    const refreshButtonContainer = document.getElementById('refreshButtonContainer');
                    if (noBotsMessageContainer) noBotsMessageContainer.style.display = 'none';
                    if (refreshButtonContainer) refreshButtonContainer.style.display = 'none';
                }
            } catch (error) {
                console.error('Error handling event:', error);
            }
        };

        eventSource.onerror = function(error) {
            console.error('EventSource error:', error);
            document.getElementById('connectionStatus').textContent = 'Disconnected';
            document.getElementById('connectionStatus').style.color = '#f44336';
            eventSource.close();

            // Attempt to reconnect if we haven't exceeded max attempts
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
                document.getElementById('connectionStatus').textContent = 'Reconnecting...';
                document.getElementById('connectionStatus').style.color = '#ff9800';
                setTimeout(setupEventSource, reconnectDelay);
            } else {
                console.error('Max reconnection attempts reached');
                document.getElementById('connectionStatus').textContent = 'Connection Failed';
            }
        };
    }

    // Initial setup of EventSource
    setupEventSource();

    // Function to set row colors
    function initializeRowColors() {
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach((row) => {
            const botName = row.querySelector('td:nth-child(1)')?.textContent.trim().split(' (')[0];
            const timeAgoColumnText = parseInt(row.querySelector('td:nth-child(3)')?.textContent.trim().slice(8, 12));
            const timeAgoMinColumnText = row.querySelector('td:nth-child(3)')?.textContent.trim().slice(10, 16);
            let initialColor = 'rgba(255, 59, 48, 0.2)'; // Dark theme red

            if (botName === undefined) {
                return; 
            }

            try {
                if (timeAgoColumnText < 10 && timeAgoMinColumnText.includes("min")) {
                    initialColor = 'rgba(52, 199, 89, 0.2)'; // Dark theme green
                } 

            } catch (error) {
                console.error(`Error parsing date for ${botName}:`, error.message);
            }

            // Apply color to row
            initialColor = rowColors[botName] || initialColor;
            row.style.backgroundColor = initialColor;

            // Add click event listener to all cells
            row.querySelectorAll('td').forEach(cell => {
                cell.addEventListener('click', function () {
                    const newColor = row.style.backgroundColor.includes('rgba(52, 199, 89, 0.2)') ? 'rgba(255, 59, 48, 0.2)' : 'rgba(52, 199, 89, 0.2)';
                    row.style.backgroundColor = newColor;

                    if (botName) {
                        rowColors[botName] = newColor;
                    }
                });
            });
        });
    }

    // Fetch the latest bot data
    async function fetchLatestBots() {
        try {
            const response = await fetch('/deRoute/latestBotEntries');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const bots = await response.json();
            console.log('Fetched latest bots:', bots);

            // Clear the existing table rows
            tableBody.innerHTML = '';

            // Prepare new rows from fetched bot data
            const newRows = bots.map(bot => `
                <tr>
                    <td><a href="/deRoute/botKills?id=${bot._id}">${bot.bot_name} <br> (${bot.combat_lv})</a>
                        <div id="equipment-images-${bot._id}" class="equipment-grid"></div>
                        <span class="hunter-name">hunted by: <a href="/qcRoute/player-latest-bots?hunter_name=${bot.most_recent_kill.hunter_name}">${bot.most_recent_kill.hunter_name}</a></span>
                    </td>
                    <td><span style="font-size: larger;">${bot.most_recent_kill.world_number}</span></td>
                    <td>${new Date(bot.most_recent_kill.kill_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <br> ${calculateMinutesSinceKill(bot.most_recent_kill.kill_date)} ago</td>
                    <td>${formatNumber(bot.most_recent_kill.loot_amount)}</td>
                </tr>
            `).join('');

            // Add new rows to the table
            tableBody.innerHTML = newRows;

            // Fetch and display equipment images for each bot
            bots.forEach(bot => {
                fetchEquipmentSet(bot._id, bot.equipment_set_name);
            });

            // Reinitialize row colors after table update
            initializeRowColors();

            // Check if there are any bots to display
            const noBotsMessageContainer = document.getElementById('noBotsMessageContainer');
            const refreshButtonContainer = document.getElementById('refreshButtonContainer');
            const hasBots = tableBody.children.length > 0 && tableBody.children[0].tagName === 'TR' && tableBody.children[0].children.length > 0;
            if (hasBots) {
                noBotsMessageContainer.style.display = 'none';
                refreshButtonContainer.style.display = 'none';
            } else {
                noBotsMessageContainer.style.display = 'block';
                refreshButtonContainer.style.display = 'block';
            }

        } catch (error) {
            console.error('Error fetching latest bots:', error);
        }

        // Apply filter after the table loads
        filterBotsByCombatLevel(parseInt(localStorage.getItem('combatLevel')), parseInt(localStorage.getItem('combatRange')));
    }

    // Toggle filter container visibility
    document.getElementById('toggleFilterBtn').addEventListener('click', function() {
        const filterContainer = document.getElementById('filterContainer');
        filterContainer.style.display = filterContainer.style.display === 'none' ? 'block' : 'none';
    });

    // Hide filter container when clicking outside of it
    document.addEventListener('click', function(event) {
        const filterContainer = document.getElementById('filterContainer');
        const toggleFilterBtn = document.getElementById('toggleFilterBtn');
        if (!filterContainer.contains(event.target) && !toggleFilterBtn.contains(event.target)) {
            filterContainer.style.display = 'none';
        }
    });

    // Filter bots when the filter button is clicked
    document.getElementById('filterBotsBtn').addEventListener('click', function() {
        const combatLevel = document.getElementById('combatLevelInput').value;
        const combatRange = document.getElementById('combatRangeInput').value;

        if (isNaN(combatLevel) || combatLevel < 3 || combatLevel > 126) {
            alert("Please enter a valid Combat Level between 3 and 126.");
            return;
        }

        if (isNaN(combatRange) || combatRange < 1 || combatRange > 55) {
            alert("Please enter a valid Combat Range between 10 and 15.");
            return;
        }

        // Store these values in localStorage
        localStorage.setItem('combatLevel', combatLevel);
        localStorage.setItem('combatRange', combatRange);

        // Filter the bots based on the combat level and range
        filterBotsByCombatLevel(combatLevel, combatRange);
    });

    // Function to filter bots based on combat level and range
    function filterBotsByCombatLevel(combatLevel, combatRange) {
        const rows = document.querySelectorAll('#week-kills-table tbody tr');
        rows.forEach(row => {
            // Assuming the combat level is stored in parentheses in the first column
            const botCombatLevelText = row.querySelector('td:nth-child(1)')?.textContent.split('(')[1]?.split(')')[0];
            const botCombatLevel = parseInt(botCombatLevelText, 10);

            // If botCombatLevel is within the range, display the row, otherwise hide it
            if (botCombatLevel >= (combatLevel - combatRange) && botCombatLevel <= (combatLevel + combatRange) || botCombatLevel === 0) {
                row.style.display = ''; // Show row
            } else {
                row.style.display = 'none'; // Hide row
            }
        });
    }

    // If filter criteria are already in localStorage, apply the filter on page load
    const storedCombatLevel = localStorage.getItem('combatLevel');
    const storedCombatRange = localStorage.getItem('combatRange');
    if (storedCombatLevel && storedCombatRange) {
        filterBotsByCombatLevel(parseInt(storedCombatLevel), parseInt(storedCombatRange));
    }

    // Function to get and validate combat level
    function getCombatLevel() {
        // Check if combat level is already saved in localStorage
        let storedCombatLevel = localStorage.getItem('combatLevel');

        // If it's not saved, prompt the user for it
        if (!storedCombatLevel) {
            // Keep prompting until the user enters a valid combat level
            while (true) {
                storedCombatLevel = prompt("Please enter your combat level (between 3 and 126):");

                // Validate the input: must be a positive integer between 3 and 126
                if (storedCombatLevel !== null) {
                    storedCombatLevel = parseInt(storedCombatLevel);

                    // Check if the combat level is a number and within the valid range
                    if (!isNaN(storedCombatLevel) && storedCombatLevel >= 3 && storedCombatLevel <= 126) {
                        // Save the valid combat level to localStorage
                        localStorage.setItem('combatLevel', storedCombatLevel);
                        break;  // Exit the loop once a valid value is entered
                    } else {
                        alert("Please enter a valid combat level between 3 and 126.");
                    }
                } else {
                    // If the user cancels the prompt, break out of the loop
                    break;
                }
            }
        }
    }

    // Call the function to get the combat level if it's not stored
    getCombatLevel();

    // Refresh the page when the refresh button is clicked
    document.getElementById('refreshPageBtn').addEventListener('click', function() {
        location.reload();
    });

    // Function to fetch and display equipment set
    async function fetchEquipmentSet(botId, equipmentSetName) {
        if (!equipmentSetName) return;
        
        try {
            const container = document.getElementById(`equipment-images-${botId}`);
            if (!container) return;

            const response = await fetch(`/deRoute/getEquipmentSet?name=${encodeURIComponent(equipmentSetName)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (!data || !data.equipment) return;

            // Create image elements for each equipment piece
            const equipment = data.equipment;
            Object.entries(equipment).forEach(([slot, item]) => {
                if (item && item.icon) {
                    const img = document.createElement('img');
                    img.src = item.icon;
                    img.alt = item.name || slot;
                    img.title = item.name || slot;
                    img.className = 'equipment-icon';
                    container.appendChild(img);
                }
            });
        } catch (error) {
            console.error('Error fetching equipment set:', error);
        }
    }

    // Show initial empty state
    const noBotsMessageContainer = document.getElementById('noBotsMessageContainer');
    if (noBotsMessageContainer) noBotsMessageContainer.style.display = 'block';
    
    // Keep table body visible
    if (tableBody) tableBody.style.display = 'table-row-group';
});
