const { ActivityType, EmbedBuilder } = require('discord.js');
const editJsonFile = require('edit-json-file')

const sobbedHimself = []

function getRektMessage(messages, id) {
    try {

        let idx = Math.floor(Math.random() * messages.length - 1);
        let sel = messages[idx];
        sel = sel.replaceAll('%s', id);

        return sel;
    } catch (e) {
        console.log(e)
        return 'sob this sob that'
    }
}

module.exports = {
    name: 'messageReactionAdd',
    once: false,
    async execute(client, int, whoReacted) {
        let emoji = int._emoji.name;
        if (emoji == '😭') {

            if (int.message.author.bot) return;
            if (sobbedHimself.includes(int.message.id)) return console.log(int.message.content + " : message was in the own sob array.")
            if (int.message.author.id == '794284745671835678' & whoReacted.id == '524788173608452097') return;
            // no more lhermes blowjobs for jinx

            if (int.message.author.id == whoReacted.id) {
                //await int.users.remove(whoReacted);
                //console.log("removing sob for: " + int.message.content + ' | who reacted: '+whoReacted.globalName)
                sobbedHimself.push(int.message.id);
                console.log(int.message.author.globalName + ' sobbed himself, adding to the messages blacklist')

                let chance = Math.floor(Math.random() * 100); // 0-100
                console.log(chance)
                if (chance >= 50) {
                    let msg = await int.message.channel.messages.fetch(int.message.id)
                    msg.reply(getRektMessage(client.config.REKT, int.message.author.id))
                }
                return;
            } // U can't sob yourself bro!!!

            var file = editJsonFile('./data/economy.json', { autosave: true })
            var data = file.data;

            let usr = int.message.author.username.replace(/[^a-zA-Z0-9]/g, '');
            if (data[usr] != null) {
                file.set(usr, data[usr] + 1)
            } else {
                file.set(usr, 1)
            }
        }
    }
};