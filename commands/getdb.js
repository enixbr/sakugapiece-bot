const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const editJsonFile = require('edit-json-file');

module.exports = {
    owner: true,
    data: new SlashCommandBuilder()
        .setName('getdb')
        .setDescription('Get JSON information about episodes & staffs!')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('category')
                .setRequired(true)
                .addChoices(
                    { name: 'Episode', value: 'ep' },
                    { name: 'Staff', value: 's' },
                ))
        .addStringOption(option => option.setName('value')
            .setDescription('ep number or staff name')
            .setRequired(true)),
    async execute(interaction, client) {
        const category = interaction.options.getString('category');
        const value = interaction.options.getString('value') // abc

        var data;
        if (category == 'ep') {
            data = editJsonFile('./data/data.json', {autosave:true})
            const rawData = data.toObject();

            const episode = rawData[value];
            if (episode == null) return interaction.reply(':x: Oops, looks like this episode does not exist!')

            interaction.reply('```json\n' + JSON.stringify(episode) + '```')
        } else {
            data = editJsonFile('./data/workers.json', {autosave:true})
            const rawData = data.toObject();

            const staff = rawData[value];
            if (staff == null) return interaction.reply(':x: Oops, looks like this staff does not exist!')

            interaction.reply('```json\n' + JSON.stringify(staff) + '```')
        }
    }
}
