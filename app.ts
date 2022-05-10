import 'dotenv/config'
import { Client, Intents, Message, MessageActionRow, MessageButton, TextChannel } from 'discord.js'
import { randomTitle, randomEmoji } from './randoms'
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

const watchChannelIDs = (process.env.WATCH_CHANNEL_ID || '').split(',')
const confirmChannelID = process.env.CONFIRM_CHANNEL_ID || ''

client.on('ready', () => {
	console.log(`Logged in as ${client.user!.tag}!`)
})

const generateComponents = (messageId: any, disabled = false) => {
	const acceptButton = new MessageButton()
		.setCustomId(`masterpiece::accept.${messageId || ''}`)
		.setLabel('Принять')
		.setStyle('SUCCESS')
		.setDisabled(disabled)
	const declineButton = new MessageButton()
		.setCustomId(`masterpiece::decline.${messageId || ''}`)
		.setLabel('Отклонить')
		.setStyle('DANGER')
		.setDisabled(disabled)
	const components = [new MessageActionRow().addComponents(acceptButton, declineButton)]
	return components
}

client.on('messageCreate', async message => {
	try {
		if (message.author === client.user || !watchChannelIDs.includes(message.channelId)) return
	
		const { embeds } = message
		const oldContent = message.content !== '' ? message.content : null
		const content = `Сообщение от <@${message.author!.id}> в <#${message.channelId}>:\n\n${oldContent || ''}`
		const files = Array.from(message.attachments.values())
	
		let messageId: string | undefined
		try {
			messageId = (await (await message.author.createDM()).send({
				content: `Твое сообщение в канале <#${message.channelId}> Мапперской отправлено на проверку и появится в канале после модерации:\n\n${oldContent || ''}`,
				embeds,
				files
			})).id
		} catch (err) { console.error(err) }
	
		const confirmChannel = await client.channels.fetch(confirmChannelID) as TextChannel
		await confirmChannel.send({ content, embeds, files, components: generateComponents(messageId) })
		await message.delete()
	} catch (err) {
		console.error(err)
	}

})

client.on('interactionCreate', async i => {
	if (!i.isButton()) return;

	const msg = i.message as Message

	let matches = /masterpiece::(accept|decline)\.(\d+)/g.exec(i.customId)
	const cmd = matches![1], messageId = matches![2]
	matches = /Сообщение от <@(\d+)> в <#(\d+)>:(?:\n\n([\w\W]+))?/gm.exec(msg.content)
	const authorId = matches![1], channelId = matches![2], content = matches![3]

	let notifyUser: boolean = false
	if (cmd === 'accept') {
		const newContent = `Сообщение от <@${authorId}>:\n\n${content || ''}`
		await i.update({
			content: `Сообщение от <@${authorId}> в <#${channelId}> (принято <@${i.user.id}>):\n\n${content || ''}`,
			components: generateComponents(messageId, true)
		})
		try {
			const channel = await client.channels.fetch(channelId) as TextChannel
			const published = await channel.send({
				content: newContent,
				embeds: msg.embeds,
				files: Array.from(msg.attachments.values())
			})
			published.react(randomEmoji())
			client.users.fetch(authorId).then(user => {
				channel.threads.create({
					name: randomTitle(user.username),
					startMessage: published
				})
			})
			notifyUser = true
		} catch (err) {
			console.error(err)
			await msg.edit({
				content: `Сообщение от <@${authorId}> в <#${channelId}>:\n\n${content || ''}`,
				components: generateComponents(messageId)
			})
		}
	} else if (cmd === 'decline') {
		await i.update({
			content: `Сообщение от <@${authorId}> в <#${channelId}> (отклонено <@${i.user.id}>):\n\n${content || ''}`,
			components: generateComponents(messageId, true)
		})
		notifyUser = true
	}

	try {
		if (messageId !== '' && notifyUser) {
			const user = await client.users.fetch(authorId)
			const dm = await user.createDM()
			await dm.send({
				reply: {  messageReference: messageId, failIfNotExists: false },
				content: cmd === 'accept' ? `Одобрено! Ищи себя в канале <#${channelId}> Мапперской` : 'Это сообщение было отклонено'
			})
		}
	} catch (err) { console.error(err) }

})

client.login(process.env.BOT_TOKEN)

import express from 'express'
const app = express()
app.get('/', (_req, res) => res.send('ok'))
app.listen(process.env.PORT || 3000, () => console.log('web server up'))