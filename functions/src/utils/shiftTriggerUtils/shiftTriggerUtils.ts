import { Timestamp } from 'firebase-admin/firestore';
import {
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import { sendEmail } from '../../notification/email';
import {
  getClientDetails,
  getClientEmail,
  getLocationManagerEmail,
  getLocationSendEmailForEachShift,
  getLocationSendEmailToClient,
  getPatrolDetails,
  getPatrolDocs,
  getPatrolName,
} from '../firebaseUtils';
import { generatePdfFromHtml } from '../pdf/generatePdfFromHtml';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { convertTimestampToDate } from '../misc';
const generateHtmlContent = async (
  darData: IPatrolLogsCollection[],
  startTime: string,
  endTIme: string,
  guardName: string,
  clientName: string
): Promise<string> => {
  if (!darData || darData.length === 0) {
    return '<html><body><h1>No Patrol data available</h1></body></html>';
  }

  const dar = darData[0]; // Assuming you want to use the first DAR entry for the header information
  const employeeName = dar.PatrolLogGuardName;
  const date = dar.PatrolDate; // Replace with actual data if available

  let patrolInfoHTML = '';
  for (const item of darData) {
    let checkpointImagesHTML = '';
    for (const checkpoint of item.PatrolLogCheckPoints) {
      let checkpointImages = '';
      if (checkpoint.CheckPointImage != null) {
        for (const image of checkpoint.CheckPointImage) {
          checkpointImages += `<img src="${image}" style="max-width: 100%; height: auto; display: block; margin-bottom: 10px;">`;
        }
      }
      checkpointImagesHTML += `
        <div>
          <p>Checkpoint Name: ${checkpoint.CheckPointName}</p>
          ${checkpointImages}
          <p>Comment: ${checkpoint.CheckPointComment}</p>
          <p>Reported At: ${convertTimestampToDate(checkpoint.CheckPointReportedAt)}</p>
          <p>Status: ${checkpoint.CheckPointStatus}</p>
        </div>
      `;
    }
    const patrolName = await getPatrolName(item.PatrolId);
    patrolInfoHTML += `
      <tr>
        <td>${item.PatrolLogPatrolCount} - ${patrolName}</td>
        <td>${convertTimestampToDate(item.PatrolLogStartedAt)}</td>
        <td>${convertTimestampToDate(item.PatrolLogEndedAt)}</td>
        <td>${checkpointImagesHTML}</td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Report</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
            }
            * {
                page-break-before: avoid !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
            }
            header {
                background-color: #333;
                color: white;
                padding: 20px;
                text-align: center;
            }
            .logo-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            .logo-container img {
                max-height: 50px;
            }
            h1 {
                margin: 0;
                font-size: 24px;
                flex-grow: 1;
            }
            section {
                padding: 20px;
                background-color: #fff;
                margin-bottom: 20px;
                border-radius: 5px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                page-break-inside: avoid !important;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                page-break-inside: avoid !important;
            }
            th {
                background-color: #f2f2f2;
            }
            img {
                max-width: 100%;
                height: auto;
                display: block;
                margin-bottom: 10px;
                max-height: 200px;
            }
            footer {
                background-color: #333;
                color: white;
                text-align: center;
                padding: 10px 0;
                margin-top: auto;
            }
        </style>
    </head>
    <body>
        <header>
            <h1>Security Report</h1>
        </header>
        <section>
            <h2>Dear ${clientName},</h2>
            <p>I hope this email finds you well. I wanted to provide you with an update on the recent patrol activities carried out by our assigned security guard during their shift. Below is a detailed breakdown of the patrols conducted.</p>
        </section>
        <section>
            <h3>Shift Information</h3>
            <table>
                <tr>
                    <th>Guard Name</th>
                    <th>Shift Time In</th>
                    <th>Shift Time Out</th>
                </tr>
                <tr>
                    <td>${guardName}</td>
                    <td>${startTime}</td>
                    <td>${endTIme}</td>
                </tr>
            </table>
        </section>
        <section>
            <h3>Patrol Information</h3>
            <table>
                <tr>
                    <th>Patrol Count</th>
                    <th>Patrol Time In</th>
                    <th>Patrol Time Out</th>
                    <th>Checkpoint Details</th>
                </tr>
                ${patrolInfoHTML}
            </table>
        </section>
        <section>
            <h3>Comments</h3>
            <table>
                <tr>
                    <th>Incident</th>
                    <th>Important Note</th>
                    <th>Feedback Note</th>
                </tr>
            </table>
        </section>
        <footer>
            <p>&copy; 2024 TEAM TACTTIK. All rights reserved.</p>
        </footer>
    </body>
    </html>
  `;
};

// export const processAndSendPatrolReport = async (
//   empId: string,
//   shiftId: string,
//   recipientEmails: string[], // array of email addresses
//   shiftStartTime: string,
//   shiftEndTime: string,
//   guardName: string,
//   clientName: string
// ): Promise<void> => {
//   const darData = await getPatrolDocs(empId, shiftId);
//   console.log(darData);
//   if (darData.length === 0) {
//     console.log(
//       'No Patrol documents found for the specified employee and shift.'
//     );
//     return;
//   }

//   const htmlContent = await generateHtmlContent(
//     darData,
//     shiftStartTime,
//     shiftEndTime,
//     guardName,
//     clientName
//   );
//   const pdfBuffer = await generatePdfFromHtml(htmlContent);

//   if (pdfBuffer) {
//     for (const email of recipientEmails) {
//       // Use `const` for loop iteration
//       await sendEmail({
//         from_name: 'Tacttik',
//         subject: 'Shift End Report',
//         html: htmlContent,
//         to_email: email, // Send email to the current recipient
//         attachments: [
//           {
//             filename: 'ShiftReport.pdf',
//             content: pdfBuffer as unknown as string, // Might need type correction
//             contentType: 'application/pdf',
//           },
//         ],
//       });
//       console.log(`Email sent successfully to ${email}.`);
//     }
//   }
// };
const splitBuffer = (buffer: Buffer, chunkSize: number): Buffer[] => {
  const chunks: Buffer[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    const end = offset + chunkSize;
    chunks.push(buffer.slice(offset, end));
    offset = end;
  }

  return chunks;
};
export const processAndSendPatrolReport = async (
  empId: string,
  shiftId: string,
  shiftStartTime: string,
  shiftEndTime: string,
  guardName: string
): Promise<void> => {
  console.log('Execution Started');
  const darData = await getPatrolDocs(empId, shiftId);

  if (darData.length === 0) {
    console.log(
      'No Patrol documents found for the specified employee and shift.'
    );
    return;
  }

  const recipientEmails: string[] = [
    'sutarvaibhav37@gmail.com',
    // 'Evan@york-construction.ca',
    'pankaj.kumar1312@yahoo.com',
    'dan@tpssolution.com',
    'sales@tpssolution.com',
    // ClientEmail,
    // nica@lestonholdings.com
  ];

  const patrolDetailsMap = new Map<string, IPatrolsCollection>();

  // Fetch patrol details and create a map
  await Promise.all(
    darData.map(async (log) => {
      const patrolDetails = await getPatrolDetails(log.PatrolId);
      if (patrolDetails) {
        patrolDetailsMap.set(log.PatrolId, patrolDetails);
      }
    })
  );

  const patrolsByClient: { [clientId: string]: IPatrolLogsCollection[] } = {};

  darData.forEach((log) => {
    const patrolDetails = patrolDetailsMap.get(log.PatrolId);
    if (patrolDetails) {
      const clientId = patrolDetails.PatrolClientId;
      const PatrolLocationId = patrolDetails.PatrolLocationId;
      if (!patrolsByClient[clientId]) {
        patrolsByClient[clientId] = [];
      }
      patrolsByClient[clientId].push(log);
    }
  });

  for (const clientId in patrolsByClient) {
    const clientDetails = await getClientDetails(clientId);
    const { ClientName, ClientEmail } = clientDetails;

    if (!ClientEmail) {
      console.log(`No email found for the client ID: ${clientId}`);
      continue;
    }

    // Ensure ClientEmail is unique and not already in the recipient list
    // if (!recipientEmails.includes(ClientEmail)) {
    //   recipientEmails.push(ClientEmail);
    // }\
    const patrolDetails = patrolDetailsMap.values().next().value;
    const patrolLocationId = patrolDetails.PatrolLocationId;
    const sendShiftEmailToManger =
      await getLocationSendEmailForEachShift(patrolLocationId);
    if (sendShiftEmailToManger == true) {
      const mangerEmail = await getLocationManagerEmail(patrolLocationId);
      const sendEmailToClient =
        await getLocationSendEmailToClient(patrolLocationId);

      if (sendEmailToClient == true) {
        if (!recipientEmails.includes(ClientEmail)) {
          console.log('Manger Email Added');

          recipientEmails.push(ClientEmail);
        }
      }
      if (mangerEmail && !recipientEmails.includes(mangerEmail)) {
        console.log('Manger Email Added');
        recipientEmails.push(mangerEmail);
      }
    }
    console.log('Emails' + recipientEmails);
    const htmlContent = await generateHtmlContent(
      patrolsByClient[clientId],
      shiftStartTime,
      shiftEndTime,
      guardName,
      ClientName
    );
    const pdfBuffer = await generatePdfFromHtml(htmlContent);
    if (pdfBuffer) {
      for (const email of recipientEmails) {
        try {
          await sendEmail({
            from_name: 'Tacttik',
            subject: 'Shift End Report',
            html: htmlContent,
            to_email: email,
            attachments: [
              {
                filename: 'ShiftReport.pdf',
                content: pdfBuffer as unknown as string, // Might need type correction
                contentType: 'application/pdf',
              },
            ],
          });
          console.log(`Email sent successfully to ${email}.`);
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
        }
      }
    }
  }
};

function dateFormat(arg0: any, arg1: string) {
  throw new Error('Function not implemented.');
}
