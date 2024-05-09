import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export const sendEmail = async ({
  from_name,
  subject,
  to_email,
  attachments,
  bcc,
  cc,
  html,
  text,
}: {
  to_email: string;
  from_name: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: { filename: string; content: string; contentType: string }[];
  bcc?: string[];
  cc?: string[];
}) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    debug: true,
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASSWORD,
    },
  });

  const mailOptions: Mail.Options = {
    from: `${from_name} <${process.env.SENDER_EMAIL}>`,
    to: to_email,
    subject,
    text: text ?? '',
    html: html ?? '',
    cc,
    bcc,
    attachments: attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.content, 'base64'),
      contentType: attachment.contentType,
    })),
  };

  await transporter.sendMail(mailOptions);

  transporter.close();
};
