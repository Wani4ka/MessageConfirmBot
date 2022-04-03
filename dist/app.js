"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES] });
const watchChannelID = process.env.WATCH_CHANNEL_ID || '';
const confirmChannelID = process.env.CONFIRM_CHANNEL_ID || '';
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
client.on('messageCreate', (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (message.author === client.user || message.channelId !== watchChannelID)
            return;
        const { channel, embeds } = message;
        const oldContent = message.content !== '' ? message.content : null;
        const content = `Сообщение от <@${message.author.id}>:\n\n${oldContent || ''}`;
        const files = Array.from(message.attachments.values());
        yield message.delete();
        let messageId;
        try {
            messageId = (yield (yield message.author.createDM()).send({
                content: `Твое сообщение в канале шедевров Мапперской отправлено на проверку и появится в канале после модерации:\n\n${oldContent || ''}`,
                embeds,
                files
            })).id;
        }
        catch (err) {
            console.error(err);
        }
        const acceptButton = new discord_js_1.MessageButton()
            .setCustomId('masterpiece.accept')
            .setLabel('Принять')
            .setStyle('SUCCESS');
        const declineButton = new discord_js_1.MessageButton()
            .setCustomId('masterpiece.decline')
            .setLabel('Отклонить')
            .setStyle('DANGER');
        const components = [new discord_js_1.MessageActionRow().addComponents(acceptButton, declineButton)];
        const confirmChannel = yield client.channels.fetch(confirmChannelID);
        const response = yield confirmChannel.send({ content, embeds, files, components });
        const collector = response.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000 });
        collector.on('collect', (i) => __awaiter(void 0, void 0, void 0, function* () {
            acceptButton.setDisabled(true);
            declineButton.setDisabled(true);
            if (i.customId === 'masterpiece.accept') {
                yield channel.send({ content, embeds, files });
                yield i.update({ content: `Сообщение от <@${message.author.id}> (принято <@${i.user.id}>):\n\n${oldContent || ''}`, components });
            }
            else if (i.customId === 'masterpiece.decline')
                yield i.update({ content: `Сообщение от <@${message.author.id}> (отклонено <@${i.user.id}>):\n\n${oldContent || ''}`, components });
            try {
                if (messageId)
                    (yield message.author.createDM()).send({
                        reply: { messageReference: messageId, failIfNotExists: false },
                        content: i.customId === 'masterpiece.accept' ? 'Одобрено! Ищи себя в канале шедевров Мапперской' : 'Это сообщение было отклонено'
                    });
            }
            catch (err) {
                console.error(err);
            }
        }));
    }
    catch (err) {
        console.error(err);
    }
}));
client.login(process.env.BOT_TOKEN);
//# sourceMappingURL=app.js.map