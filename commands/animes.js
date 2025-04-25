const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const editJsonFile = require('edit-json-file');

module.exports = {
    name: 'animes',
    data: new SlashCommandBuilder()
    .setName('animes')
    .setDescription('Lists all the playable animes in sakugatrain.'),
    async execute(message, client) {

        // Load anime data
        const quizData = editJsonFile('./data/quiz.json').data;
        const animes = Object.keys(quizData);
        const itemsPerPage = 20; // Number of anime titles per page
        const totalPages = Math.ceil(animes.length / itemsPerPage);

        // Function to create embed for a specific page
        const createEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageAnimes = animes.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle('Sakugatrain playable anime list')
                .setColor('#0099ff')
                .setDescription(pageAnimes.map(anime => `\`${anime}\``).join('\n'))
                .setFooter({ text: `Page ${page + 1} of ${totalPages} | Total Animes: ${animes.length}` })
                .setTimestamp();

            return embed;
        };

        // Create navigation buttons
        const createButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages - 1)
            );
        };

        // Send initial message
        let currentPage = 0;
        const embedMessage = await message.reply({
            embeds: [createEmbed(currentPage)],
            components: [createButtons(currentPage)],
        });

        // Create button interaction collector
        const collector = embedMessage.createMessageComponentCollector({
            time: 60000, // 1 minute timeout
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'Only the command issuer can use these buttons!', ephemeral: true });
            }

            // Update page based on button clicked
            if (interaction.customId === 'prev' && currentPage > 0) {
                currentPage--;
            } else if (interaction.customId === 'next' && currentPage < totalPages - 1) {
                currentPage++;
            }

            // Update message with new embed and buttons
            await interaction.update({
                embeds: [createEmbed(currentPage)],
                components: [createButtons(currentPage)],
            });
        });

        collector.on('end', async () => {
            // Disable buttons after timeout
            await embedMessage.edit({
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                )],
            });
        });
    },
};