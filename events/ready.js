const { ActivityType, EmbedBuilder } = require('discord.js');
const editJsonFile = require('edit-json-file')

function parseTime(timestamp) {
    const now = Math.floor(Date.now() / 1000); // Get current time in Unix timestamp (seconds)
    let diffInSeconds = timestamp - now;
  
    if (diffInSeconds <= 0) return "...";
  
    const days = Math.floor(diffInSeconds / (24 * 60 * 60));
    diffInSeconds -= days * (24 * 60 * 60);
  
    const hours = Math.floor(diffInSeconds / (60 * 60));
    diffInSeconds -= hours * (60 * 60);
  
    const minutes = Math.floor(diffInSeconds / 60);
  
    let result = '';
    if (days > 0) result += `${days}d, `;
    if (hours > 0) result += `${hours}h, `;
    if (minutes > 0) result += `${minutes}m, `;
  
    return result.replace(/,\s*$/, ""); // Remove trailing comma and space
}

module.exports = {
    name: 'ready', 
    once: true,
    async execute(client) { 
        try {
            setInterval(async() => {
                var Time = new Date();

                if (Time.getMinutes() % 10 == 0) { // each 10 mins
                    var data = editJsonFile('./config.json').data;
                    var data2 = editJsonFile('./data/data.json').data;

                    var Objk = Object.keys(data2);
                    var Timed = parseTime(data.WATCHPARTY)
                    
                    //const Chan1 = await client.channels.fetch('1124811815050825748')
                    const Chan2 = await client.channels.fetch(data.WATCHPARTY_CHANNEL_ID) // TIME REMAINING
                    Chan2.setName('Watchparty in ' + Timed)

                    client.user.setActivity({
                        name: 'Listing ' + (Objk.length-1) + ' episodes ( '+ Objk[0] + ' ~ ' + Objk[Objk.length-3]+ ' )',
                        type: ActivityType.Custom,
                    });
                }
            },30000)

        } catch (e) {
            console.log(e)
        }

    },
};

