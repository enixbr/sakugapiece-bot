const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const editJsonFile = require('edit-json-file');

module.exports = {
    owner: true,
    data: new SlashCommandBuilder()
        .setName('setdb')
        .setDescription('Set JSON information about episodes & staffs!')
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
            .setRequired(true))
        .addStringOption(option => option.setName('value2')
            .setDescription('json')),
    async execute(interaction, client) {
        const category = interaction.options.getString('category');
        const value = interaction.options.getString('value') // abc
        const value2 = interaction.options.getString('value2') == null ? "" : interaction.options.getString('value2') // abc

        var data;
        if (category == 'ep') {
            data = editJsonFile('./data/data.json', {autosave:true})

            let jsonn;

            try {
                if (value2 == "") {
                    interaction.reply({content: ':thumbsup:', ephemeral: true});
                    return data.unset(value);
                }
                jsonn = JSON.parse(value2);
                data.set(value, jsonn);

                interaction.reply({content: ':thumbsup:', ephemeral: true});
            } catch (e) { interaction.reply("something went wrong"); console.log(e)}
        } else {
            data = editJsonFile('./data/workers.json', {autosave:true})
            let jsonn;

            try {
                if (value2 == "") {
                    interaction.reply({content: ':thumbsup:', ephemeral: true});
                    return data.unset(value);
                }
                jsonn = JSON.parse(value2);
                data.set(value, jsonn);

                interaction.reply({content: ':thumbsup:', ephemeral: true});
            } catch (e) { interaction.reply("something went wrong"); console.log(e)}
        }
    }
}
