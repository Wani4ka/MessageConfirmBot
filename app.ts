import 'dotenv/config'
import { Client, Intents, MessageActionRow, MessageButton, TextChannel } from 'discord.js'
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

const watchChannelIDs = (process.env.WATCH_CHANNEL_ID || '').split(',')
const confirmChannelID = process.env.CONFIRM_CHANNEL_ID || ''

client.on('ready', () => {
	console.log(`Logged in as ${client.user!.tag}!`)
})

client.on('messageCreate', async message => {
	try {
		if (message.author === client.user || !watchChannelIDs.includes(message.channelId)) return
	
		const { channel, embeds } = message
		const oldContent = message.content !== '' ? message.content : null
		const content = `Сообщение от <@${message.author!.id}> в <#${message.channelId}>:\n\n${oldContent || ''}`
		const files = Array.from(message.attachments.values())
	
		let messageId: string
		try {
			messageId = (await (await message.author.createDM()).send({
				content: `Твое сообщение в канале шедевров Мапперской отправлено на проверку и появится в канале после модерации:\n\n${oldContent || ''}`,
				embeds,
				files
			})).id
		} catch (err) { console.error(err) }
	
		const acceptButton = new MessageButton()
			.setCustomId('masterpiece.accept')
			.setLabel('Принять')
			.setStyle('SUCCESS')
		const declineButton = new MessageButton()
			.setCustomId('masterpiece.decline')
			.setLabel('Отклонить')
			.setStyle('DANGER')
		const components = [new MessageActionRow().addComponents(acceptButton, declineButton)]
	
		const confirmChannel = await client.channels.fetch(confirmChannelID) as TextChannel
		const response = await confirmChannel.send({ content, embeds, files, components })
		const newFiles = Array.from(response.attachments.values())

		await message.delete()
	
		const collector = response.createMessageComponentCollector({ componentType: 'BUTTON' })
		collector.on('collect', async i => {
			acceptButton.setDisabled(true)
			declineButton.setDisabled(true)
			if (i.customId === 'masterpiece.accept') {
				const newContent = `Сообщение от <@${message.author!.id}>:\n\n${oldContent || ''}`
				await channel.send({ content: newContent, embeds, files: newFiles })
				await i.update({ content: `Сообщение от <@${message.author!.id}> (принято <@${i.user.id}>):\n\n${oldContent || ''}`, components })
			} else if (i.customId === 'masterpiece.decline')
				await i.update({ content: `Сообщение от <@${message.author!.id}> (отклонено <@${i.user.id}>):\n\n${oldContent || ''}`, components })

			try {
				if (messageId)
					(await message.author.createDM()).send({
						reply: {  messageReference: messageId, failIfNotExists: false },
						content: i.customId === 'masterpiece.accept' ? `Одобрено! Ищи себя в канале <#${channel.id}> Мапперской` : 'Это сообщение было отклонено'
					})
			} catch (err) { console.error(err) }
			collector.stop()
		})
	} catch (err) {
		console.error(err)
	}

})

client.login(process.env.BOT_TOKEN)

import express from 'express'
const app = express()
app.get('/', (_req, res) => res.send('ok'))
app.listen(process.env.PORT || 3000, () => console.log('web server up'))