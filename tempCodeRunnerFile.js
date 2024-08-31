for (const bot of botKills) {
    //     let updated = false; // Track if we make any updates to avoid unnecessary save operations
  
    //     // Iterate through worlds and kills
    //     for (const [world, worldData] of bot.worlds.entries()) {
    //       worldData.kills.forEach(kill => {
    //         if (typeof kill.kill_date === 'string') {
    //           // Convert string to Date object
    //           kill.kill_date = new Date(kill.kill_date);
    //           updated = true;
    //         } else if (!kill.kill_date) {
    //           // Handle the case where kill_date is missing
    //           kill.kill_date = null; // Set to null or a default date
    //           updated = true;
    //         }
    //       });
    //     }
  
    //     if (updated) {
    //       // Save only if changes were made
    //       await BotKill.updateOne({ _id: bot._id }, { $set: { worlds: bot.worlds } });
    //       console.log(`Updated bot with ID: ${bot._id}`);
    //     }
    //   }
  