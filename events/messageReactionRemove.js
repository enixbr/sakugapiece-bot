const { ActivityType, EmbedBuilder } = require('discord.js');
const editJsonFile = require('edit-json-file')

module.exports = {
    name: 'messageReactionRemove', 
    once: false,
    async execute(client, int, whoReacted) { 
        let emoji = int._emoji.name;
        if (emoji == '😭') {

            if (int.message.author.bot) return;
            if (int.message.author.id == whoReacted.id) return; // U can't sob yourself bro!!!

            var file = editJsonFile('./data/economy.json', {autosave: true})
            var data = file.data;

            let usr = int.message.author.username.replace(/[^a-zA-Z0-9]/g, '');
            if (data[usr] != null) {
                if (data[usr] == 0) return console.log("AAAAAAAAAAAA");
                file.set(usr, data[usr]-1)
            } else {
                file.set(usr, 0)
            }
        }
    }
};

