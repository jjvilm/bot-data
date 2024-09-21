const axios = require('axios');

async function getPlayerCombatLevel(username) {
  try {
    // Construct the URL for fetching player profile data from RuneMetrics
    const url = `https://apps.runescape.com/runemetrics/profile/profile?user=${username}&activities=20`;

    // Fetch player profile data from RuneMetrics API
    const response = await axios.get(url);

    // Extract the data from the response
    const data = response.data;
    console.log(data)

    // Check if the data contains the relevant information
    if (data && data.name) {
      // Extract the relevant fields
      const { name, combatlevel } = data;
      console.log(`Player ${name}'s Combat Level: ${combatlevel}`);
    } else {
      console.log(`Player ${username} not found or no combat level data available.`);
    }
  } catch (error) {
    console.error('Error fetching player data:', error);
  }
}

// Example usage
getPlayerCombatLevel('kindserin');
