const { SlashCommandBuilder } = require('@discordjs/builders');
const editJsonFile = require('edit-json-file');

const config = editJsonFile('./config.json').data;

const activeQuizzes = new Map();

function checkForRole(xp) {
    if (xp <= 25) return ["1347555386844254239", "Newbie"];
    if (xp > 25 && xp <= 100) return ["1347556137633058877", "Amateur"];
    if (xp > 100 && xp <= 300) return ["1347555974918963260", "Professional"];
    if (xp > 300 && xp <= 750) return ["1347555216358244473", "Enthusiast"];
    if (xp > 750 && xp <= 1000) return ["1347555287111831673", "Master"];
    if (xp > 1000 && xp <= 2000) return ["1352322207686332527", "Master II"];
    if (xp > 2000 && xp <= 5000) return ["1352322474771087360", "Master III"];
}

function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Starts a sakuga quiz!')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of phases')
                .setMaxValue(50)
                .setMinValue(1)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('anime')
                .setDescription('Anime name')),

    async execute(interaction, client) {
        if (interaction.channelId !== config.QUIZ_CHANNEL_ID) {
            return interaction.reply({ content: "> :x: You can only use this command in the quiz channel!", ephemeral: true });
        }

        let Amount;
        let specificAnime = null;
        const userId = interaction.notinteraction ? interaction.author.id : interaction.user.id;

        if (interaction.notinteraction) {
            const args = interaction.content.split(' ').slice(1);
            if (args.length < 1 || isNaN(args[0])) {
                return interaction.reply({ content: "> :x: Provide a valid amount (e.g., !quiz 2 [anime name])", ephemeral: true });
            }
            Amount = parseInt(args[0]);
            if (Amount > 50 || Amount <= 0) {
                return interaction.reply({ content: "> :x: Provide an amount between 1 and 50.", ephemeral: true });
            }
            if (args.length > 1) {
                specificAnime = args.slice(1).join(' ').toLowerCase();
            }
        } else {
            Amount = interaction.options.getInteger('amount');
            if (interaction.options.getString('anime')) specificAnime = interaction.options.getString('anime').toLowerCase();
        }

        if (activeQuizzes.has(userId)) {
            return interaction.reply({ content: "> :x: **You already have an ongoing quiz! Finish it first.**", ephemeral: true });
        }

        if (!interaction.notinteraction) {
            await interaction.deferReply();
        }

        activeQuizzes.set(userId, { ongoing: true });
        const clipUsage = new Map();

        try {
            const file = editJsonFile('./data/quiz.json', { autosave: true });
            const quizData = file.data;
            const animeList = Object.keys(quizData);

            if (specificAnime && !animeList.map(a => a.toLowerCase()).includes(specificAnime)) {
                activeQuizzes.delete(userId);
                if (interaction.notinteraction) {
                    return interaction.reply({ content: `:x: **Anime "${specificAnime}" not found in the quiz database!**`, ephemeral: true });
                } else {
                    return interaction.editReply({ content: `:x: **Anime "${specificAnime}" not found in the quiz database!**` });
                }
            }

            if (interaction.notinteraction) interaction.delete();

            const thread = await interaction.channel.threads.create({
                name: `${interaction.notinteraction ? interaction.author.username : interaction.user.username}'s quiz (${generateRandomString()})`,
                autoArchiveDuration: 60,
                reason: 'Quiz thread for sakuga train',
            });

            await thread.members.add(userId);

            const messageCollector = thread.createMessageCollector({
                filter: m => !m.author.bot && m.author.id === userId,
                time: Amount * 30000
            });

            /*messageCollector.on('collect', m => {
                messagesToDelete.push(m);
                if (m.content.toLowerCase() === 'stop') {
                    activeQuizzes.delete(userId);
                    thread.send(`:information_source: **<@${userId}> quiz stopped.**`);
                    messageCollector.stop();
                    thread.delete();
                }
            });*/

            messageCollector.on('end', async (collected, reason) => {
                if (reason === 'time' && activeQuizzes.has(userId)) {
                    activeQuizzes.delete(userId);
                    if (!thread.deleted) {
                        await thread.send(`:x: **<@${userId}> quiz timed out.**`);
                    }
                    await thread.delete();
                }
            });

            for (let phase = 1; phase <= Amount; phase++) {
                if (!activeQuizzes.get(userId)?.ongoing) break;

                const targetAnime = specificAnime ?
                    animeList.find(a => a.toLowerCase() === specificAnime) :
                    animeList[Math.floor(Math.random() * animeList.length)];

                const clips = quizData[targetAnime];
                const clipUrls = Object.keys(clips);

                if (!clipUrls.length) {
                    const noClipsMessage = await thread.send({ content: `:x: **No clips available for ${targetAnime}!**` });

                    activeQuizzes.delete(userId);
                    await thread.delete();
                    break;
                }

                let randomClip;
                let attempts = 0;
                const maxAttempts = 10;
                let clipFound = false;

                while (attempts < maxAttempts) {
                    randomClip = clipUrls[Math.floor(Math.random() * clipUrls.length)];
                    const currentCount = clipUsage.get(randomClip) || 0;

                    if (currentCount === 0) {
                        clipUsage.set(randomClip, 1);
                        clipFound = true;
                        break;
                    }

                    attempts++;
                }

                if (!clipFound) {
                    const cancelMessage = await thread.send({ content: `:x: **<@${userId}> quiz cancelled because of repeated clips (${maxAttempts} attempts made)**` });

                    activeQuizzes.delete(userId);
                    await thread.delete();
                    return;
                }

                const correctAnimators = clips[randomClip];

                const clipMessage = await thread.send({
                    content: `<@${userId}> Quiz - Phase ${phase}/${Amount}:\n[.](${randomClip})`
                });


                const totalTime = 30000;
                const barLength = 10;
                const updateInterval = 3000;
                let remainingTime = totalTime;

                const generateProgressBar = (remaining) => {
                    const elapsed = totalTime - remaining;
                    const filled = Math.round((elapsed / totalTime) * barLength);
                    const empty = barLength - filled;
                    return '🟥'.repeat(filled) + '🟩'.repeat(empty);
                };

                const progressMessage = await thread.send({
                    content: `Time remaining: ${Math.ceil(remainingTime / 1000)}s\n${generateProgressBar(remainingTime)}`
                });


                let progressInterval = setInterval(() => {
                    remainingTime -= updateInterval;
                    if (remainingTime <= 0) {
                        clearInterval(progressInterval);
                        if (!progressMessage.deleted) {
                            progressMessage.delete();
                            progressMessage.deleted = true;
                        }
                        return;
                    }
                    progressMessage.edit({
                        content: `Time remaining: ${Math.ceil(remainingTime / 1000)}s\n${generateProgressBar(remainingTime)}`,
                    });
                }, updateInterval);

                const phaseResult = await new Promise((resolve) => {
                    const filter = m => !m.author.bot && m.author.id === userId;
                    const collector = thread.createMessageCollector({
                        filter,
                        time: totalTime
                    });

                    let answeredCorrectly = false;

                    collector.on('collect', async m => {
                        const guess = m.content.toLowerCase().trim();
                        if (guess === "skip") {
                            clearInterval(progressInterval);
                            if (!progressMessage.deleted) {
                                progressMessage.delete();
                                progressMessage.deleted = true;
                            }
                            resolve(`**<@${userId}> Phase ${phase} skipped!**\n**Correct answers were:** ${correctAnimators.join(", ")}`);
                            collector.stop();
                        } else {
                            const isCorrect = correctAnimators.some(animator => {
                                const animatorLower = animator.toLowerCase();
                                const isShortName = animatorLower.length < 4;
                                return animatorLower.includes(guess) && (isShortName || guess.length > 3);
                            });

                            if (isCorrect) {
                                answeredCorrectly = true;
                                clearInterval(progressInterval);
                                if (!progressMessage.deleted) {
                                    progressMessage.delete();
                                    progressMessage.deleted = true;
                                }

                                let scoreData = editJsonFile('./data/score.json', { autosave: true });
                                let usr = m.author.username.replace(/[^a-zA-Z0-9]/g, '');
                                let usrp = scoreData.get(usr);

                                if (usrp == null || usrp == undefined) scoreData.set(usr, 1);
                                else {
                                    scoreData.set(usr, Number(usrp) + 1);

                                    const guild = await client.guilds.fetch('1105893783217909853');
                                    const member = await guild.members.fetch(m.author.id);

                                    const roleId = checkForRole(Number(usrp) + 1);
                                    const role = guild.roles.cache.get(roleId[0]);

                                    if (!role) {
                                        console.log("couldn't find role");
                                    } else {
                                        const memberRoles = member.roles.cache.map(r => r.name);
                                        const hasRole = memberRoles.includes("Sakuga " + roleId[1]);

                                        if (!hasRole) {
                                            await member.roles.add(role);
                                            const roleMessage = await thread.send(`> <@${m.author.id}> has won the **${roleId[1]}** role! :tada:`);

                                        }
                                    }
                                }

                                collector.stop();
                                resolve(`:tada: <@${m.author.id}> **you got it right!**\n**Correct answers were:** ${correctAnimators.join(", ")}`);
                            }
                        }
                    });

                    collector.on('end', () => {
                        clearInterval(progressInterval);
                        if (!answeredCorrectly) {
                            if (!progressMessage.deleted) {
                                progressMessage.delete();
                                progressMessage.deleted = true;
                            }
                            resolve(`:x: **Time's up <@${userId}>! Correct answers were:** ${correctAnimators.join(", ")}`);
                        }
                    });
                });

                const resultMessage = await thread.send(phaseResult);

                if (phase < Amount) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (activeQuizzes.get(userId)?.ongoing) {
                const completionMessage = await thread.send(`**<@${userId}> quiz completed successfully!**`);

                activeQuizzes.delete(userId);
                await thread.delete();
            }

        } catch (error) {
            activeQuizzes.delete(userId);
            console.error(error);
            if (interaction.notinteraction) {
                await interaction.channel.send(`> :x: **An error occurred during <@${userId}>'s quiz!**`);
            } else {
                await interaction.editReply(`> :x: **An error occurred during <@${userId}>'s quiz!**`);
            }
        }
    }
};