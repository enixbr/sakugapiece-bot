const { SlashCommandBuilder } = require('@discordjs/builders');
const editJsonFile = require('edit-json-file');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('catalogstaff')
        .setDescription('Catalogs all workers.'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Load data.json
            const dataFile = editJsonFile('./data/data.json', { autosave: true });
            const data = dataFile.data;

            // Load existing workers.json to count previous workers
            const workersFile = editJsonFile('./data/workers.json', { autosave: true });
            const existingWorkers = workersFile.data || {};
            const previousWorkerCount = Object.keys(existingWorkers).length;

            // Initialize new workers object
            let workers = {};

            // Process each entry in data.json
            Object.entries(data).forEach(([episodeId, episodeData]) => {
                const staff = episodeData.staff || {};
                const episodeDate = episodeData.date || 0;

                Object.entries(staff).forEach(([role, staffList]) => {
                    staffList.forEach(workerName => {
                        if (!workers[workerName]) {
                            workers[workerName] = {
                                roles: [],
                                picture: "",
                                holdings: {},
                                last_work: "",
                                last_work_date: 0,
                                socials: {},
                                debut: 0
                            };
                        }

                        const worker = workers[workerName];

                        if (!worker.roles.includes(role)) {
                            worker.roles.push(role);
                        }

                        if (!worker.holdings[episodeId]) {
                            worker.holdings[episodeId] = [];
                        }
                        if (!worker.holdings[episodeId].includes(role)) {
                            worker.holdings[episodeId].push(role);
                        }

                        if (episodeDate > worker.last_work_date) {
                            worker.last_work = episodeId;
                            worker.last_work_date = episodeDate;
                        }

                        if (worker.debut === 0 || episodeDate < worker.debut) {
                            // worker.debut = episodeDate;
                        }
                    });
                });
            });

            // Count new total and calculate new workers
            const newWorkerCount = Object.keys(workers).length;
            const newWorkersAdded = newWorkerCount - previousWorkerCount;

            // Save the new workers data to workers.json
            workersFile.set(workers); // Replace entire content with new workers object
            workersFile.save();

            await interaction.editReply(`> :white_check_mark: Successfully cataloged workers.\n**Total staff:** ${newWorkerCount} | **New staff added:** ${newWorkersAdded}`);
        } catch (error) {
            console.error(error);
            await interaction.editReply("> :x: **An error occurred while cataloging staff!**");
        }
    }
};