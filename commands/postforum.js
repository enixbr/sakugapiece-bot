const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ThreadAutoArchiveDuration } = require('discord.js');
const editJsonFile = require('edit-json-file');

  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

module.exports = {
    admin: true,
    data: new SlashCommandBuilder()
        .setName('postforum')
        .setDescription('Post episode to thread')
        .addStringOption(option =>
          option.setName('input')
              .setDescription('Episode number.')
              .setRequired(true)),
    async execute(interaction, client) {
        const ep = Number( interaction.options.getString('input') )// 1071

        var data = editJsonFile('./config.json');
        data = data.toObject();

        const episodes = editJsonFile('./data/data.json', {autosave:true})
        const dataJson = episodes.toObject()

        const Forum = await client.channels.fetch(data.EPISODE_FORUM_CHANNEL_ID) // EP FORUM

        const episodeData = dataJson[ep];

        if (episodeData == null) return interaction.reply(':x: Oops, looks like this episode does not exist or it isnt listed on my database!')
        if (episodeData.threadID != "") return interaction.reply(':x: Already catalogued.')

        interaction.reply({content: 'ok', ephemeral: true})

        const ratingString = "-# Episode rated as " + episodeData.rating + "/10 :star: with " + episodeData.votes + " votes."
        
        const embed = new EmbedBuilder()
        .setTitle("#"+ ep + ": " + `"${episodeData.title == null ? "Unable to get title" : episodeData.title }"`)
        .setDescription((episodeData.rating != null ? ratingString : "") + "\n-# This episode aired " + client.timeAgo(episodeData.date))
        //.setURL(`https://example.com/episode/${episodeData.threadID}`)
        .setThumbnail(episodeData.picture)
        //.setTimestamp(new Date(episodeData.date));
        let tags = "";
        tags = (episodeData.tags+"").replaceAll(",", " / ")

        if (episodeData.tags.length>0) embed.setFooter({
          text: `**${tags}**`
        })

        for (const staffKey in episodeData.staff) {
          if (episodeData.staff.hasOwnProperty(staffKey)) {
            const staffValues = episodeData.staff[staffKey].map(name => `\`${name}\``).join(', ');
            if (staffKey != 'Key Animation') embed.addFields({ name: `${staffKey} (${episodeData.staff[staffKey].length})`, value: '-# ' + staffValues, inline: true});
            else embed.addFields({ name: `${staffKey} (${episodeData.staff[staffKey].length})`, value: '-# ' + staffValues});
          }
        }

        let booruUrl = 'https://sakugabooru.com/post.json?tags=one_piece+source%3A%23' + (ep < 1000 ? "0"+ep : ep) + '&limit=100';

        if (ep == 1122.5) booruUrl = 'https://sakugabooru.com/post.json?tags=fan_letter&limit=100' // Fan Letter
        if (ep == 1122.6) booruUrl = 'https://sakugabooru.com/post.json?tags=los_angeles_lakers_x_one_piece_collab&limit=100' // Lakers

        await Forum.threads.create({
            name: `[ ${episodeData.rating == null ? '?' : episodeData.rating} ] Episode #${ep}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            message: {
             embeds: [embed]
            },
          }).then(async(thread) => {
            
            checkAndAdd = function(value) {
                if (episodeData.tags.includes(value)) return;
                episodeData.tags.push(value)
                
                if (episodeData.tags.includes("not rated")) episodeData.tags.splice(episodeData.tags.indexOf("not rated"), 1);
            }

            if (episodeData.rating >= 9) checkAndAdd('awesome episode')
            if (episodeData.rating >= 8 & episodeData.rating < 9) checkAndAdd('good episode')
            if (episodeData.rating >= 7 & episodeData.rating < 8) checkAndAdd('average episode')
            if (episodeData.rating > 5 & episodeData.rating < 6.99) checkAndAdd('mediocre episode')
            if (episodeData.rating <= 5 & episodeData.rating != null) checkAndAdd('bad episode')
            if (episodeData.rating == null) checkAndAdd('not rated')

            episodes.set(ep, episodeData)

            thread.messages.pin(thread.lastMessageId)

            await fetch(booruUrl)
            .then(res => res.json())
            .then(async(json) => {
                let objk = Object.keys(json)

                if (objk.length == 0) {
                    if (!episodeData.tags.includes('no sakuga')) {
                        episodeData.tags.push('no sakuga')
                        episodes.set(ep, episode)
                    }

                    return;
                }

                for (i=0;i<objk.length;i++) {
                    thread.send({content: '# > [#' + json[i].id + '](' + json[i].file_url + ')\n-# :star: `Score: ' + json[i].score + '`\n-# :alarm_clock: `Uploaded:` <t:' + Number(json[i].created_at) + ':R> \n**```' + json[i].tags + '```**', embeds: []})
                    await sleep(1250)
                }
            })

            let postTags = []

            episodeData.tags.forEach(tag => {
                if (postTags.includes(tag)) {} else {
                if (data.FORUM_TAGS[tag] != undefined & data.FORUM_TAGS[tag] != null) postTags.push(data.FORUM_TAGS[tag])}
            })

            thread.setAppliedTags(postTags);
            episodeData.threadID = thread.id
            episodes.set(ep, episodeData)
            episodes.save()

            interaction.channel.send(":white_check_mark: done with ep " + ep)
          }).catch(console.error);
    }
}
