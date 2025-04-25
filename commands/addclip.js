const { SlashCommandBuilder } = require('@discordjs/builders');
const editJsonFile = require('edit-json-file');


module.exports = {
    admin: false,
    data: new SlashCommandBuilder()

        .setName('addclip')
        .setDescription('Adds a clip to the sakuga quiz')
        .addStringOption(option =>
        option.setName('anime_name')
        .setDescription('The anime name for the clip.')
        .setRequired(true))
        .addStringOption(option =>
        option.setName('clip')
        .setDescription('The sakuga .mp4 clip')
        .setRequired(true))
        .addStringOption(option =>
        option.setName('credits')
        .setDescription('List of KAs separated by comma e.g: (vincent chansard,tam lu,kohei hirota)')
        .setRequired(true)),

    async execute(interaction, client) {

        if (!interaction.member.roles.cache.has('1358410668918968393')) return interaction.reply({content: ':x: you are not allowed to use this command.', ephemeral: true})

        const Anime = interaction.options.getString('anime_name');
        const Clip = interaction.options.getString('clip');
        const Credits = interaction.options.getString('credits').split(',');

        const file = editJsonFile('./data/quiz.json', {autosave: true});
        const data = file.data;

        try {
            if (data[Anime] != null) {
                data[Anime][Clip] = Credits;

                file.set(data)

                interaction.reply({content: ':white_check_mark: added new clip to an existing anime!', ephemeral: true})
            } else {
                data[Anime] = {}
                data[Anime][Clip] = Credits;

                file.set(data)

                interaction.reply({content: ':white_check_mark: added new anime and its first clip!', ephemeral: true})
            }
            
        } catch (e) {
            interaction.reply({content: ':x: something went wrong!', ephemeral: true})
            console.log(e)
        }
        
    }
}
