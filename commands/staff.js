const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const editJsonFile = require('edit-json-file');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff')
        .setDescription('Displays information about a staff member.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the staff member to look up.')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Define userId for button interaction
            const userId = interaction.notinteraction ? interaction.author.id : interaction.user.id;

            // Load workers.json
            const workersFile = editJsonFile('./data/workers.json', { autosave: true });
            const workers = workersFile.data || {};

            // Get the staff name from the command option
            let staffName = interaction.options.getString('name').trim();

            // Check if the staff member exists (exact match, case-insensitive)
            let matchedName = null;
            const workerNames = Object.keys(workers);
            for (const name of workerNames) {
                if (name.toLowerCase() === staffName.toLowerCase()) {
                    matchedName = name;
                    break;
                }
            }

            // If no exact match, try fuzzy matching using the quiz logic
            if (!matchedName) {
                for (const name of workerNames) {
                    const nameLower = name.toLowerCase();
                    const guessLower = staffName.toLowerCase();
                    const isShortName = nameLower.length < 4;
                    if (nameLower.includes(guessLower) && (isShortName || guessLower.length > 3)) {
                        matchedName = name;
                        break;
                    }
                }

                if (!matchedName) {
                    return interaction.editReply(`> :x: **Staff member "${staffName}" not found, and no similar names were found!**`);
                }

                // await interaction.channel.send(`> :information_source: Staff member "${staffName}" not found. Showing results for **${matchedName}** instead.`);
            }

            const worker = workers[matchedName];

            // Calculate total works (number of episodes in holdings)
            const totalWorks = Object.keys(worker.holdings).length;

            // Format roles
            const roles = worker.roles.join(' / ');

            // Format last appearance
            const lastAppearanceDate = new Date(worker.last_work_date);
            const now = new Date();
            const timeDiff = now - lastAppearanceDate;
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const months = Math.floor(days / 30);
            const remainingDays = days % 30;
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let lastAppearance = '';
            if (months > 0) lastAppearance += `${months} month${months > 1 ? 's' : ''}, `;
            if (remainingDays > 0 || months > 0) lastAppearance += `${remainingDays} day${remainingDays !== 1 ? 's' : ''}, `;
            lastAppearance += `${hours} hour${hours !== 1 ? 's' : ''} ago`;

            // Calculate average episode difference
            let avgEpisodeDiffField = null;
            if (totalWorks >= 2) { // Need at least 2 episodes to calculate a difference
                // Extract episode numbers and sort them numerically
                const episodeNumbers = Object.keys(worker.holdings)
                    .map(num => parseFloat(num)) // Convert to numbers
                    .sort((a, b) => a - b); // Sort numerically

                // Calculate differences between consecutive episodes
                const differences = [];
                for (let i = 1; i < episodeNumbers.length; i++) {
                    differences.push(episodeNumbers[i] - episodeNumbers[i - 1]);
                }

                // Calculate average difference
                const avgDiff = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;

                // Round to create a range (e.g., 3~5)
                const lowerBound = Math.floor(avgDiff);
                const upperBound = Math.ceil(avgDiff);
                const range = lowerBound === upperBound ? `${lowerBound}` : `${lowerBound}~${upperBound}`;

                avgEpisodeDiffField = range;
            }

            // Initial message
            let currentPage = 0;
            const worksPerPage = 5;
            const works = Object.entries(worker.holdings);

            // Function to format the works for the current page
            const formatWorksPage = (page) => {
                const start = page * worksPerPage;
                const end = start + worksPerPage;
                const pageWorks = works.slice(start, end);
                return pageWorks.map(([episodeId, roles]) => `-# **#${episodeId}**: ${roles.join(', ')}`).join('\n');
            };

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(matchedName)
                .setDescription('**`' + roles + '`**');

            // Add fields dynamically
            const fields = [
                { name: '🔍 Last apparition', value: `**#${worker.last_work}**` +' `'+`(${lastAppearance})`+'`', inline: true },
                { name: '🎬 Works', value: `${totalWorks} works **(appears once ${avgEpisodeDiffField} eps)**`, inline: true }
            ];

            // Add the "Appears each" field if it exists
            /*if (avgEpisodeDiffField) {
                fields.push(avgEpisodeDiffField);
            }*/

            fields.push({ name: `📜 Appeared in`, value: works.length > 0 ? formatWorksPage(currentPage) : 'No works available.' });

            embed.addFields(fields);
            embed.setFooter({ text: `Today at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` });

            // Create buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`works_prev_${userId}_${matchedName}`)
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId(`works_next_${userId}_${matchedName}`)
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage >= Math.ceil(works.length / worksPerPage) - 1)
                );

            // Send initial embed
            await interaction.editReply({ embeds: [embed], components: [row] });

            // Button interaction collector
            const filter = i => i.customId.startsWith(`works_`) && i.customId.includes(userId) && i.customId.includes(matchedName);
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId.includes('prev') && currentPage > 0) {
                    currentPage--;
                } else if (i.customId.includes('next') && currentPage < Math.ceil(works.length / worksPerPage) - 1) {
                    currentPage++;
                }

                // Update buttons
                row.components[0].setDisabled(currentPage === 0);
                row.components[1].setDisabled(currentPage >= Math.ceil(works.length / worksPerPage) - 1);

                // Update embed
                embed.spliceFields(-1, 1, { // Replace the last field (Information)
                    name: `📜 Appeared in`,
                    value: works.length > 0 ? formatWorksPage(currentPage) : 'No works available.'
                });

                await i.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', () => {
                row.components.forEach(button => button.setDisabled(true));
                interaction.editReply({ embeds: [embed], components: [row] });
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply("> :x: **An error occurred while fetching staff information!**");
        }
    }
};