const { ActivityType, EmbedBuilder } = require('discord.js');
const editJsonFile = require('edit-json-file')
const fetch = require('node-fetch')

var data = editJsonFile('./data/data.json').data;
var Objk = Object.keys(data);

const quizCommand = require('../commands/quiz.js')
const topCommand = require('../commands/top.js')
const animeCommand = require('../commands/animes.js')

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(client, message) {
        if (message.author.bot) return;

        if (message.content == '!timestamp') {
            if (message.author.id != '731625052222521346') return;
            try {
                client.config.WATCHPARTY = (client.config.WATCHPARTY + 604800);

                await client.updateCommandCount('timestamp')


                let file = editJsonFile('../config.json', {autosave: true})
                file.set(client.config)
                message.reply('done!')
            } catch (e) {
                console.log(e)
            }
        }

        if (message.content == '!watchparty' || message.content == '!wp' || message.content == '!time') {
            await client.updateCommandCount('watchparty')
            return message.reply('<#1281383019768316016>')
        }

        if (message.content.startsWith("!quiz")) {
            message.notinteraction = true;
            await client.updateCommandCount('quiz')
            return await quizCommand.execute(message, client)
        }

        if (message.content.startsWith("!top")) {
            message.notinteraction = true;
            await client.updateCommandCount('top')
            return await topCommand.execute(message, client)
        }

        if(message.content.startsWith("!animes")) {
            message.notinteraction = true;
            await client.updateCommandCount('animes')
            return await animeCommand.execute(message, client)
        }

        if (message.author.id == "382196049906761729") {// melting finall boss

            let chance = Math.floor(Math.random() * 100);

            if (chance > 97) { // like 3% chance
                message.reply('melting final boss')
            }
        }

        if (message.author.id == "496786084286562306") {// nakano soldier

            let chance = Math.floor(Math.random() * 50);

            if (chance > 97) { // like 3% chance
                message.reply('nakano\'s strongest soldier')
            }
        }

        if (message.content.includes('/https://x.com')) { // Embed twitter posts
            if (message.channel.id === '1109100367045730415' || message.channel.id === '1156469916917047386') return;
            let msg = message;
            let content = msg.content;
            content = content.replace('//x.com', '//vxtwitter.com');
            content = content.replace(/\@/g, ''); // no pings lil bro

            content += '\n\n> Sent by: **' + msg.author.username + '**'

            await message.delete();

            msg.channel.send(content)
        }

        const msg = await message.fetch()

        if (msg.content === `<@${client.config.APP_ID}>`) {

            for (i = 0; i < 1000; i++) {
                var ep = (1 + Math.floor(Math.random() * Number(Objk[Objk.length - 3])))
                if ((ep + "").length == 3) ep = "0" + ep;
                if ((ep + "").length == 2) ep = "00" + ep;
                if ((ep + "").length == 1) ep = "000" + ep;
                let canStop = false;

                try {
                    await fetch('https://sakugabooru.com/post.json?tags=one_piece+source%3A%23' + ep + '&limit=1000')
                        .then(res => res.json())
                        .then(json => {
                            const obk = Object.keys((json))

                            console.log(ep)

                            var idx = (Math.floor(Math.random() * obk.length) - 1)
                            if (idx < 0) idx = 0;

                            msg.reply({ content: '# > [#' + json[idx].id + '](' + json[idx].file_url + ') ( episode #' + ep + ' )\n-# :star: `Score: ' + json[idx].score + '`\n-# :alarm_clock: `Uploaded: ' + client.timeAgo(Number(json[idx].created_at + '000')) + '`\n**```' + json[idx].tags + '```**' })
                            canStop = true;
                        })
                } catch (e) {
                    console.log(e)
                }

                if (canStop) break;
            }
        }
    },
};

