const { SlashCommandBuilder } = require('@discordjs/builders');
const { PollLayoutType } = require('discord.js');

module.exports = {
    admin: true,
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Start poll')
        .addIntegerOption(option => option.setName('ep')
        .setDescription('Episode number')
        .setRequired(true)),
    async execute(interaction, client) {
        const ep = interaction.options.getInteger('ep');

        interaction.channel.send({
            poll: {
                question: { text: "How would you rate One Piece episode #" + ep + " ?"},
                answers: [
                    {text: "10 of 10", emoji: '🔟'},
                    {text: "9 of 10", emoji: '9️⃣'},
                    {text: "8 of 10", emoji: '8️⃣'},
                    {text: "7 of 10", emoji: '7️⃣'},
                    {text: "6 of 10", emoji: '6️⃣'},
                    {text: "5 of 10", emoji: '5️⃣'},
                    {text: "4 of 10", emoji: '4️⃣'},
                    {text: "3 of 10", emoji: '3️⃣'},
                    {text: "2 of 10", emoji: '2️⃣'},
                    {text: "1 of 10", emoji: '1️⃣'}
                ],
                allowMultiselect: false,
                layoutType: PollLayoutType.Default,
            }
        })

        interaction.reply({content: ':white_check_mark: done!', ephemeral: true})
    }
}
