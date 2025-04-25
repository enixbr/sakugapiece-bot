const { EmbedBuilder, Client, PermissionsBitField, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { Guilds, GuildMessages, GuildMessageReactions, MessageContent } = GatewayIntentBits;
const client = new Client({ intents: [Guilds, GuildMessages, GuildMessageReactions, MessageContent] });
const editJsonFile = require('edit-json-file');

client.config = require('./config.json');
client.cooldowns = new Map();
client.cache = new Map();

require('./utils/ComponentLoader.js')(client);
require('./utils/EventLoader.js')(client);
require('./utils/RegisterCommands.js')(client);

console.log(`Loggingo in...`);
client.login(client.config.TOKEN);

const TARGET_CHANNEL_ID = '1358179255082684737';
const SEND_FANCLUB_MENU = false;
const SEND_COLOR_MENU = false;

client.updateCommandCount = async function (commandName) {
    if (client.config.COMMANDS_COUNTER[commandName] == null) {
        client.config.COMMANDS_COUNTER[commandName] = 1;
    } else {
        client.config.COMMANDS_COUNTER[commandName]++;
    }

    editJsonFile('./config.json').set(client.config).save();
}

client.timeAgo = function (timestamp) {
    const currentDate = new Date();
    const pastDate = new Date(timestamp);

    let years = currentDate.getFullYear() - pastDate.getFullYear();
    let months = currentDate.getMonth() - pastDate.getMonth();
    let days = currentDate.getDate() - pastDate.getDate();
    let hours = currentDate.getHours() - pastDate.getHours();
    let minutes = currentDate.getMinutes() - pastDate.getMinutes();
    let seconds = currentDate.getSeconds() - pastDate.getSeconds();

    // Adjust for negative values
    if (seconds < 0) {
        minutes -= 1;
        seconds += 60;
    }

    if (minutes < 0) {
        hours -= 1;
        minutes += 60;
    }

    if (hours < 0) {
        days -= 1;
        hours += 24;
    }

    if (days < 0) {
        months -= 1;
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        days += lastMonth.getDate();
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    // Format the result
    const result = [
        years ? `${years} year${years > 1 ? 's' : ''}` : '',
        months ? `${months} month${months > 1 ? 's' : ''}` : '',
        days ? `${days} day${days > 1 ? 's' : ''}` : '',
        hours ? `${hours} hour${hours > 1 ? 's' : ''}` : ''
    ].filter(Boolean).join(', ');

    if (timestamp == 0) result = " ( unable to get drop date )"

    return result + " ago";
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        // Fetch the target channel
        const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (!channel || !channel.isTextBased()) {
            console.error(`Channel with ID ${TARGET_CHANNEL_ID} not found or is not a text channel.`);
            return;
        }

        // Fetch all roles from the server
        const guild = channel.guild;
        const roles = await guild.roles.fetch();

        // --- Fanclub Role Selector ---
        // Filter roles that contain "fanclub" in their name (case-insensitive)
        const fanclubRoles = roles.filter(role =>
            role.name.toLowerCase().includes('fanclub') &&
            !role.managed &&
            role.editable
        );

        // Check if any fanclub roles were found
        if (fanclubRoles.size === 0) {
            console.error('No roles with "fanclub" in their name were found in this server.');
            if (SEND_FANCLUB_MENU) {
                await channel.send({ content: 'No roles with "fanclub" in their name were found in this server.' });
            }
        } else if (SEND_FANCLUB_MENU) {
            // Convert fanclubRoles to an array
            const fanclubRolesArray = Array.from(fanclubRoles.values());

            // Check for max options
            if (fanclubRolesArray.length > 125) {
                console.warn(`Too many fanclub roles (${fanclubRolesArray.length}). Only the first 125 will be included.`);
                fanclubRolesArray.length = 125;
            }

            // Split roles into chunks of 25
            const fanclubRoleChunks = [];
            for (let i = 0; i < fanclubRolesArray.length; i += 25) {
                fanclubRoleChunks.push(fanclubRolesArray.slice(i, i + 25));
            }

            // Create action rows for fanclub roles
            const fanclubActionRows = fanclubRoleChunks.map((chunk, index) => {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fanclub_role_selector_${index}`)
                    .setPlaceholder(`Select fanclub roles (${index * 25 + 1}-${Math.min((index + 1) * 25, fanclubRolesArray.length)})`)
                    .setMinValues(0)
                    .setMaxValues(chunk.length);

                chunk.forEach(role => {
                    selectMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(role.name)
                            .setValue(role.id)
                            .setDescription(`Join ${role.name}!`)
                            .setEmoji('🎉')
                    );
                });

                return new ActionRowBuilder().addComponents(selectMenu);
            });

            // Send fanclub role selector
            await channel.send({
                content: 'Do you have a favourite animator? Pick below',
                components: fanclubActionRows
            });

            console.log(`Fanclub role selector(s) sent to channel ${TARGET_CHANNEL_ID} with ${fanclubRoleChunks.length} dropdown(s)`);
        }

        // --- Color Role Selector ---
        // Filter roles that contain "color" in their name (case-insensitive)
        const colorRoles = roles.filter(role =>
            role.name.toLowerCase().includes('color') &&
            !role.managed &&
            role.editable
        );

        // Check if any color roles were found
        if (colorRoles.size === 0) {
            console.error('No roles with "color" in their name were found in this server.');
            if (SEND_COLOR_MENU) {
                await channel.send({ content: 'No roles with "color" in their name were found in this server.' });
            }
            return;
        }

        if (SEND_COLOR_MENU) {
            // Convert colorRoles to an array
            const colorRolesArray = Array.from(colorRoles.values());

            // Check for max options
            if (colorRolesArray.length > 125) {
                console.warn(`Too many color roles (${colorRolesArray.length}). Only the first 125 will be included.`);
                colorRolesArray.length = 125;
            }

            // Split roles into chunks of 25
            const colorRoleChunks = [];
            for (let i = 0; i < colorRolesArray.length; i += 25) {
                colorRoleChunks.push(colorRolesArray.slice(i, i + 25));
            }

            // Create action rows for color roles
            const colorActionRows = colorRoleChunks.map((chunk, index) => {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`color_role_selector_${index}`)
                    .setPlaceholder(`Select a color for your name (${index * 25 + 1}-${Math.min((index + 1) * 25, colorRolesArray.length)})`)
                    .setMinValues(0)
                    .setMaxValues(1);

                chunk.forEach(role => {
                    selectMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(role.name)
                            .setValue(role.id)
                            .setDescription(`Choose ${role.name}!`)
                            .setEmoji('✨')
                    );
                });

                return new ActionRowBuilder().addComponents(selectMenu);
            });

            // Send color role selector
            await channel.send({
                content: 'Pick your name color below!',
                components: colorActionRows
            });

            console.log(`Color role selector(s) sent to channel ${TARGET_CHANNEL_ID} with ${colorRoleChunks.length} dropdown(s)`);
        }

    } catch (error) {
        console.error('Error setting up role selectors:', error);
    }
});

async function InteractionHandler(interaction, type) {
    const component = client[type].get(interaction.customId ?? interaction.commandName);
    if (!component) {
        return;
    }

    try {
        if (component.admin) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: `⚠️ Only administrators can use this command!`, ephemeral: true });
        }

        if (component.owner) {
            if (interaction.user.id !== '731625052222521346') return await interaction.reply({ content: `⚠️ Only bot owners can use this command!`, ephemeral: true });
        }

        await client.updateCommandCount(interaction.commandName)

        await component.execute(interaction, client);
    } catch (error) {
        console.error("stack" in error ? error.stack : error);
        await interaction.deferReply({ ephemeral: true }).catch(() => { });
        await interaction.editReply({
            content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
            embeds: [],
            components: [],
            files: []
        }).catch(() => { });
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('fanclub_role_selector_') && !interaction.customId.startsWith('color_role_selector_')) return;

    await interaction.deferUpdate();

    const member = interaction.member;
    const selectedValues = interaction.values;

    try {
        // Fetch all roles from the server
        const guild = interaction.guild;
        const roles = await guild.roles.fetch();

        // Determine which type of role selector was used
        const isColorSelector = interaction.customId.startsWith('color_role_selector_');
        const roleType = isColorSelector ? 'color' : 'fanclub';
        const roleFilter = role =>
            role.name.toLowerCase().includes(roleType) &&
            !role.managed &&
            role.editable;

        const filteredRoles = roles.filter(roleFilter);
        const allRoleIds = Array.from(filteredRoles.keys());
        const userRoles = allRoleIds.filter(roleId => member.roles.cache.has(roleId));
        const rolesToRemove = userRoles.filter(roleId => !selectedValues.includes(roleId));

        // Remove unselected roles
        await Promise.all(
            rolesToRemove.map(async roleId => {
                await member.roles.remove(roleId).catch(err => console.error(`Failed to remove ${roleType} role ${roleId}:`, err));
            })
        );

        // Add selected roles
        await Promise.all(
            selectedValues.map(async roleId => {
                const role = filteredRoles.get(roleId);
                if (role && !member.roles.cache.has(roleId)) {
                    await member.roles.add(roleId).catch(err => console.error(`Failed to add ${roleType} role ${roleId}:`, err));
                }
            })
        );

        // Send confirmation
        await interaction.followUp({
            content: `Your ${roleType} roles have been updated! You now have: ${selectedValues.length > 0 ? selectedValues.map(roleId => filteredRoles.get(roleId).name).join(', ') : `no ${roleType} roles`}.`,
            ephemeral: true
        });

    } catch (error) {
        console.error(`Error handling ${interaction.customId.startsWith('color_role_selector_') ? 'color' : 'fanclub'} role selection:`, error);
        await interaction.followUp({
            content: `There was an error updating your ${interaction.customId.startsWith('color_role_selector_') ? 'color' : 'fanclub'} roles. Please try again later.`,
            ephemeral: true
        });
    }
});

client.on('interactionCreate', async function (interaction) {
    try {
        if (!interaction.isCommand()) return;
        await InteractionHandler(interaction, 'commands');
    } catch (e) { console.log(e) }
});

client.on('interactionCreate', async function (interaction) {
    if (!interaction.isButton()) return;
    await InteractionHandler(interaction, 'buttons');
});

client.on('interactionCreate', async function (interaction) {
    if (!interaction.isStringSelectMenu()) return;
    await InteractionHandler(interaction, 'dropdowns');
});

client.on('interactionCreate', async function (interaction) {
    if (!interaction.isModalSubmit()) return;
    await InteractionHandler(interaction, 'modals');
});