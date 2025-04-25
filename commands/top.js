const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const editJsonFile = require('edit-json-file');
const config = editJsonFile('./config.json');

function checkForRole(xp) {
    if (xp <= 25) return ["1347555386844254239", "Newbie"];
    if (xp > 25 && xp <= 100) return ["1347556137633058877", "Amateur"];
    if (xp > 100 && xp <= 300) return ["1347555974918963260", "Professional"];
    if (xp > 300 && xp <= 750) return ["1347555216358244473", "Enthusiast"];
    if (xp > 750 && xp <= 1000) return ["1347555287111831673", "Master"];
    if (xp > 1000 && xp <= 2000) return ["1352322207686332527", "Master II"];
    if (xp > 2000 && xp <= 5000) return ["1352322474771087360", "Master III"];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Displays leaderboards for Sakugatrain or Economy.'),
    async execute(interaction, client) {

        let user = interaction.user;
        if (interaction.notinteraction !== undefined) {
            user = { username: interaction.author.username };
        }

        const leaderboards = [
            { name: 'Sakugatrain', file: './data/score.json', title: '🌟 Sakugatrain Top 10 Leaderboard', useRoles: true },
            { name: 'Sob Economy', file: './data/economy.json', title: '😭 Top 10 Leaderboard for Sobs', useRoles: false }
        ];
        let currentLeaderboardIndex = 0;

        const generateLeaderboard = async () => {
            const leaderboard = leaderboards[currentLeaderboardIndex];
            const score = editJsonFile(leaderboard.file, { autosave: true }).data;
            const Objk = Object.keys(score);

            const leaderboardData = Objk.map(name => ({
                name: name,
                score: score[name]
            })).sort((a, b) => b.score - a.score);

            let text = "";
            for (let i = 0; i < 10; i++) {
                if (!leaderboardData[i]) break;
                let usr = leaderboardData[i];
                let role = leaderboard.useRoles ? checkForRole(usr.score) : ['N/A', 'N/A'];
                if (i === 0) text += ":first_place:" + ` **${usr.name}**\n-# ${usr.score} points ${leaderboard.useRoles ? `*(Sakuga ${role[1]})*` : ''}\n\n`;
                if (i === 1) text += ":second_place:" + ` **${usr.name}**\n-# ${usr.score} points ${leaderboard.useRoles ? `*(Sakuga ${role[1]})*` : ''}\n\n`;
                if (i === 2) text += ":third_place:" + ` **${usr.name}**\n-# ${usr.score} points ${leaderboard.useRoles ? `*(Sakuga ${role[1]})*` : ''}\n\n`;
                if (i > 2) text += "`" + (i + 1) + "°`" + ` **${usr.name}**\n-# ${usr.score} points ${leaderboard.useRoles ? `*(Sakuga ${role[1]})*` : ''}\n\n`;
            }

            const usrName = user.username.replace(/[^a-zA-Z0-9]/g, '');
            const userScore = score[usrName] || 0;
            const userRole = leaderboard.useRoles ? checkForRole(userScore)[1] : 'N/A';

            const embed = new EmbedBuilder()
                .setTitle(leaderboard.title)
                .setDescription(`-# Leaderboard for top 10 people with highest score in ${leaderboard.name.toLowerCase()}.\n${text}\n-# Ranking a total of ${Object.keys(leaderboardData).length} people.\n-# Your score: ${userScore} points ${leaderboard.useRoles ? `*(Sakuga ${userRole})*` : ''}`)
                .setTimestamp();

            const leftButton = new ButtonBuilder()
                .setCustomId('left')
                .setEmoji('⬅️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentLeaderboardIndex === 0);

            const rightButton = new ButtonBuilder()
                .setCustomId('right')
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentLeaderboardIndex === leaderboards.length - 1);

            const row = new ActionRowBuilder().addComponents(leftButton, rightButton);

            return { embeds: [embed], components: [row] };
        };

        const message = await interaction.reply({ ...(await generateLeaderboard()), fetchReply: true });

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.author.id) {
                //await i.reply({ content: 'Only the command initiator can use these buttons.', ephemeral: true });
                return;
            }

            if (i.customId === 'left') currentLeaderboardIndex--;
            if (i.customId === 'right') currentLeaderboardIndex++;

            await i.update(await generateLeaderboard());
        });

        collector.on('end', async () => {

        });
    }
};