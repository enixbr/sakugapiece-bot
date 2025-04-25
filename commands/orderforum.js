const { SlashCommandBuilder } = require('@discordjs/builders');
const editJsonFile = require('edit-json-file');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

module.exports = {
    admin: true,
    data: new SlashCommandBuilder()
        .setName('orderforum')
        .setDescription('Orders the forum'),
    async execute(interaction, client) {
        try {
        const config = editJsonFile('./config.json', {autosave: true})
        const data = config.toObject()

        const episodes = editJsonFile('./data/data.json', {autosave:true})
        const dataJson = episodes.toObject()
        const objk = Object.keys(dataJson)

        const Chan = await client.channels.fetch(data.EPISODE_FORUM_CHANNEL_ID) // EPISODE FORUM

        interaction.reply({content: ':thumbsup:', ephemeral: true})

        for (i=0;i<objk.length;i++) {

            let ep = dataJson[objk[i]]

            if (ep.threadID) {

                const thread = await Chan.threads.fetch(ep.threadID)

                thread.send({content: 'a', fetchReply: true}).then(msg => {
                    msg.delete()
                })

                await sleep(2000)
            }
        }

        episodes.save()
    } catch (e) {
        console.log(e)
    }
    }
}
