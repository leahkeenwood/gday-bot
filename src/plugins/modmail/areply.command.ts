import {
    SlashCommandBuilder,
    SlashCommandScope,
} from "../../builders/SlashCommandBuilder";
import { useChatCommand } from "../../hooks/useChatCommand";
import { ChatInputCommandInteraction } from "discord.js";
import { MailThread } from "./MailThread";
import { useClient } from "../../hooks";
import { ModmailMessage } from "./ModmailMessage";

const builder = new SlashCommandBuilder()
    .setName("areply")
    .setDescription("Anonymously reply within a modmail thread.")
    .addStringOption((option) =>
        option
            .setName("message")
            .setDescription("Message to send.")
            .setRequired(true),
    )
    .addAttachmentOption((option) =>
        option.setName("attachment").setDescription("Attachment to attach."),
    )
    .setScope(SlashCommandScope.STAFF_SERVER);

useChatCommand(builder, async (interaction) => {
    const thread = await MailThread.findOne({ channel: interaction.channelId });
    if (!thread) {
        return "You can only reply within modmail threads.";
    }
    const input = interaction.options.getString("message", true);
    const user = await useClient().client.users.fetch(thread.author);
    const attachment = interaction.options.getAttachment("attachment");
    const message = new ModmailMessage({
        from: interaction.user.username,
        to: user.username,
        body: input,
        anon: true,
        attachments: attachment ? [attachment.url] : undefined,
    });
    await user.send({ embeds: [message] });
    message.addStaffFields();
    return { embeds: [message] };
});
