const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType }  = require('discord.js');
const editJsonFile = require('edit-json-file');
const fetch = require('node-fetch');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

module.exports = {
    data: new SlashCommandBuilder()
        .setName('episode')
        .setDescription('Search information about episodes!')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Episode number.')
                .setRequired(true)),
    async execute(interaction, client) {
      try {
          const ep = Number( interaction.options.getString('input') )// 1071

          if (ep < 892) return interaction.reply(':x: Oops, currently we have data starting from episode 892 only!');

          const data = editJsonFile('./data/data.json', {autosave:true})
          const rawData = data.toObject();

          const episodeData = rawData[ep];
          if (episodeData == null) return interaction.reply(':x: Oops, looks like this episode does not exist or it isnt listed on my database!')

          const ratingString = "-# Episode rated as " + episodeData.rating + "/10 :star: with " + episodeData.votes + " votes."
          
          const embed = new EmbedBuilder()
          .setTitle("#"+ ep + ": " + `"${episodeData.title == null ? "Unable to get title" : episodeData.title }"`)
          .setDescription((episodeData.rating != null ? ratingString : "") + "\n-# This episode aired " + client.timeAgo(episodeData.date))
          //.setURL(`https://example.com/episode/${episodeData.threadID}`)
          .setThumbnail((episodeData.picture == "" ? "https://files.catbox.moe/1a9k43.png" : episodeData.picture))

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

          const searchButton = new ButtonBuilder().setLabel("🔍").setStyle(ButtonStyle.Primary).setCustomId("searchbttn")
          const reportButton = new ButtonBuilder().setLabel("📛").setStyle(ButtonStyle.Primary).setCustomId("reportbttn")

          const bttnRow = new ActionRowBuilder().addComponents(searchButton, reportButton);

          const msg = await interaction.reply({embeds: [embed], fetchReply: true, components: [bttnRow]})

          let collected = false;

          const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
          })

          collector.on('collect', async (int) => {
            if (int.user.id != interaction.user.id) return; // not same user
            console.log("same user")

            collected = true;

            if (int.customId == 'searchbttn') {
              await collector.stop();
              int.deferUpdate();

              try {
                let srcUrl = 'https://sakugabooru.com/post.json?tags=one_piece+source%3A%23' + (ep < 1000 ? "0"+ep : ep) + '&limit=100'

                if (ep==1122.5) srcUrl = 'https://sakugabooru.com/post.json?tags=fan_letter&limit=100'
                if (ep==1122.6) srcUrl = 'https://sakugabooru.com/post.json?tags=los_angeles_lakers_x_one_piece_collab&limit=100'
                
                await fetch(srcUrl)
                .then(res => res.json())
                .then(json => {
                  let objk = Object.keys(json)
                  let max = objk.length-1;
                  let page = 0;
    
                  if (json[0] == null) return msg.edit({content: '> :x: No clips found for this episode on the booru.', embeds: []})
    
                  const nextButton = new ButtonBuilder().setLabel("▶").setStyle(ButtonStyle.Primary).setCustomId("nextbttn")
                  const prevButton = new ButtonBuilder().setLabel("◀").setStyle(ButtonStyle.Primary).setCustomId("prevbttn")
        
                  const bttnRow2 = new ActionRowBuilder().addComponents(prevButton, nextButton);

                  msg.edit({content: '# > [#' + json[page].id + '](' + json[page].file_url + ') ( '+ page + '/' + max +' )\n-# :star: `Score: ' + json[page].score + '`\n-# :alarm_clock: `Uploaded: ' + client.timeAgo(Number(json[page].created_at + '000')) + '`\n**```' + json[page].tags + '```**', embeds: [], components: [bttnRow2]})
              
                  const collector2 = msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 60000
                  })

                  collector2.on('collect', async (int2) => {
                    if (int2.user.id != interaction.user.id) return; // not same user
                    int2.deferUpdate();

                    if (int2.customId == 'nextbttn') {
                      if (page >= max) return;
                      page+=1;

                      msg.edit({content: '# > [#' + json[page].id + '](' + json[page].file_url + ') ( '+ page + '/' + max +' )\n-# :star: `Score: ' + json[page].score + '`\n-# :alarm_clock: `Uploaded: ' + client.timeAgo(Number(json[page].created_at + '000')) + '`\n**```' + json[page].tags + '```**', embeds: [], components: [bttnRow2]})
              
                    } else {
                      if (page <= 0) return;
                      page-=1;

                      msg.edit({content: '# > [#' + json[page].id + '](' + json[page].file_url + ') ( '+ page + '/' + max +' )\n-# :star: `Score: ' + json[page].score + '`\n-# :alarm_clock: `Uploaded: ' + client.timeAgo(Number(json[page].created_at + '000')) + '`\n**```' + json[page].tags + '```**', embeds: [], components: [bttnRow2]})
              
                    }
                  })

                  collector2.on('end', () => {
                    msg.edit({content: '# > [#' + json[page].id + '](' + json[page].file_url + ')\n-# :star: `Score: ' + json[page].score + '`\n-# :alarm_clock: `Uploaded: ' + client.timeAgo(Number(json[page].created_at + '000')) + '`\n**```' + json[page].tags + '```**', embeds: [], components: []})
                  })
                })
              } catch (e) {
                msg.edit({content: "> :x: I wasn't able to fetch the booru posts for this episode, maybe the booru is down.", embeds: [], components: []})
                console.log(e)
              }
            } else if (int.customId == 'reportbttn') {
              msg.edit({content: '> :white_check_mark: episode issue reported succesfully.', embeds: [], components: []})
              client.channels.fetch('1124770736830152816').then(chan => {
                chan.send('> :warning: this episode has some issues: #' + ep + ' ( reported by: <@' + interaction.user.id + '> )')
              })
            }
          })

          collector.on('end', () => {
            if (!collected) msg.edit({embeds: [embed], fetchReply: true, components: []})
          })
      } catch (e) {
        console.log(e)
      }
    }
}
