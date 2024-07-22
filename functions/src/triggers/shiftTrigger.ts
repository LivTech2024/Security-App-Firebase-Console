/* eslint-disable max-len */
import * as functions from 'firebase-functions';
import * as schedule from 'node-schedule';

import {
  ILoggedInUsersCollection,
  IShiftsCollection,
} from '../@types/database';
import { CollectionName } from '../@types/enum';
import { sendEmail } from '../notification/email';
import {
  getClientDetails,
  getCompanyDetails,
  getEmpDetails,
  processAndSendEmployeeDARReport,
} from '../utils/firebaseUtils';
import { findRemovedElements, formatDate } from '../utils/misc';
import { processAndSendPatrolReport } from '../utils/shiftTriggerUtils/shiftTriggerUtils';
import { sendFCMNotification } from '../notification/fcm';
import { BaseMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { firestore } from 'firebase-admin';
//* Trigger tasksimport { firestore } from 'firebase-admin';
const scheduledJobs: { [key: string]: schedule.Job } = {};
const isTimestamp = (value: any): value is FirebaseFirestore.Timestamp => {
  return (
    value &&
    typeof value.seconds === 'number' &&
    typeof value.nanoseconds === 'number'
  );
};

const schedulePhotoUploadNotifications = (shiftNewData: IShiftsCollection) => {
  const intervalInMinutes = shiftNewData.ShiftPhotoUploadIntervalInMinutes;
  const shiftStartTime = shiftNewData.ShiftStartTime;
  const shiftId = shiftNewData.ShiftId;
  const users = shiftNewData.ShiftAssignedUserId;
  const [startHours, startMinutes] = shiftStartTime.split(':').map(Number);
  const shiftStartDateTime = new Date();

  if (isTimestamp(shiftNewData.ShiftDate)) {
    shiftStartDateTime.setTime(shiftNewData.ShiftDate.seconds * 1000);
  }
  shiftStartDateTime.setHours(startHours);
  shiftStartDateTime.setMinutes(startMinutes);

  const job = schedule.scheduleJob(`*/${intervalInMinutes} * * * *`, () => {
    const currentTime = new Date();
    if (currentTime >= shiftStartDateTime) {
      sendNotification(shiftId, users);
    }
  });

  scheduledJobs[shiftId] = job;
};
const sendNotification = async (
  shiftId: string,
  shiftAssignedUserId: string[]
) => {
  try {
    const fcmTokens: string[] = [];

    await Promise.all(
      shiftAssignedUserId.map(async (userId) => {
        const loggedInDocSnapshot = await firestore()
          .collection(`${CollectionName.loggedInUsers}`)
          .where('LoggedInUserId', '==', userId)
          .orderBy('LoggedInCreatedAt', 'desc')
          .limit(5)
          .get();

        const loggedInDeviceData = loggedInDocSnapshot?.docs.map(
          (doc) => doc.data() as ILoggedInUsersCollection
        );

        if (loggedInDeviceData && loggedInDeviceData.length > 0) {
          loggedInDeviceData.forEach((data) => {
            if (
              data.LoggedInNotifyFcmToken &&
              !fcmTokens.includes(data.LoggedInNotifyFcmToken)
            ) {
              fcmTokens.push(data.LoggedInNotifyFcmToken);
            }
          });
        }
      })
    );

    if (fcmTokens.length > 0) {
      const message: BaseMessage = {
        notification: {
          title: 'Photo Upload Reminder',
          body: `It's time to upload a photo for your shift.`,
        },
        data: {
          route: '/wellness_check',
        },
      };

      await sendFCMNotification(message, fcmTokens);
    }
  } catch (error) {
    console.log(error);
  }
};
const sendEmailToEmpWhoHasBeenRemovedFromShift = async (
  shiftOldData: IShiftsCollection,
  shiftNewData: IShiftsCollection
) => {
  const {
    ShiftAssignedUserId: oldUserIds,
    ShiftName,
    ShiftDate,
    ShiftStartTime,
    ShiftEndTime,
    ShiftLocationAddress,
  } = shiftOldData;
  const { ShiftAssignedUserId: newUserIds, ShiftCompanyId } = shiftNewData;

  const empRemovedIds = findRemovedElements(oldUserIds, newUserIds);

  if (empRemovedIds && empRemovedIds.length > 0) {
    const companyDetails = await getCompanyDetails(ShiftCompanyId);
    const { CompanyName } = companyDetails;

    await Promise.all(
      empRemovedIds.map(async (empId) => {
        const empDetails = await getEmpDetails(empId);

        if (empDetails) {
          const { EmployeeEmail } = empDetails;
          functions.logger.log('Sending Email to-> ', EmployeeEmail);
          await sendEmail({
            from_name: CompanyName,
            subject: 'Your schedule update',
            to_email: EmployeeEmail,
            text: `You have been removed from the shift.\n Shift Name: ${ShiftName} \n Date: ${formatDate(ShiftDate)} \n Timing: ${ShiftStartTime}-${ShiftEndTime} \n Address: ${ShiftLocationAddress || 'N/A'}`,
          });
        }
      })
    );
  }
};
//Send Dar and Report on Shift Complete trigger
export const sendEmailToEmpWhoHasCompletedShift = async (
  shiftOldData: IShiftsCollection,
  shiftNewData: IShiftsCollection
): Promise<void> => {
  const {
    ShiftAssignedUserId: oldUserIds,
    ShiftName,
    ShiftDate,
    ShiftStartTime,
    ShiftEndTime,
    ShiftLocationAddress,
    ShiftCurrentStatus,
    ShiftId,
    ShiftCompanyId,
    ShiftClientId,
    ShiftPosition,
    ShiftLocationId,
  } = shiftOldData;

  const oldStatusStarted = shiftOldData.ShiftCurrentStatus?.some(
    (status) => status.Status === 'started'
  );

  const newStatusCompleted = shiftNewData.ShiftCurrentStatus?.some(
    (status) => status.Status === 'completed'
  );

  if (oldStatusStarted && newStatusCompleted) {
    console.log('Status changed from "started" to "completed"');

    // Find the status entry with "completed"
    const completedStatus = shiftNewData.ShiftCurrentStatus.find(
      (status) => status.Status === 'completed'
    );
    if (completedStatus) {
      const { StatusReportedById, StatusReportedByName } = completedStatus;
      const companyDetails = await getCompanyDetails(ShiftCompanyId);
      const { CompanyName } = companyDetails;

      if (StatusReportedById) {
        const empDetails = await getEmpDetails(StatusReportedById);
        let ClientName = 'Clients';
        let ClientEmail = '';

        if (ShiftClientId) {
          const clientDetails = await getClientDetails(ShiftClientId);
          ClientName = clientDetails.ClientName || 'Clients';
          ClientEmail =
            clientDetails.ClientEmail || 'sutarvaibhav37@student.sfit.ac.in';
        }

        if (empDetails) {
          const { EmployeeEmail, EmployeeName } = empDetails;
          // const { ClientName, ClientEmail } = clientDetials;

          await processAndSendEmployeeDARReport(
            StatusReportedById,
            ShiftId,
            ShiftStartTime,
            ShiftEndTime,
            EmployeeEmail,
            ShiftPosition,
            ClientEmail,
            ClientName
          );
          const recipientEmails = [
            'sutarvaibhav37@gmail.com',
            // 'pankaj.kumar1312@yahoo.com',
            // 'security@lestonholdings.com',
            // 'dan@tpssolution.com',
            // 'nica@lestonholdings.com',
            // ClientEmail,
          ];

          console.log('Client Email ', ClientEmail);
          //need to combine patrol based on client id for different patrols
          await processAndSendPatrolReport(
            StatusReportedById,
            ShiftId,
            // recipientEmails,
            // 'sutarvaibhav37@gmail.com',
            ShiftStartTime,
            ShiftEndTime,
            EmployeeName
            // ClientName
          );
          console.log('Sending Email to-> ', EmployeeEmail);

          // await sendEmail({
          //   from_name: CompanyName,
          //   subject: 'Your Shift Completed',
          //   to_email: EmployeeEmail,
          //   text: `Shift Completed Trigger.\n Shift Name: ${ShiftName} \n Date: ${ShiftDate} \n Timing: ${ShiftStartTime}-${ShiftEndTime} \n Address: ${ShiftLocationAddress || 'N/A'}`,
          // });
        }
      }
    }
  }
};

export const shiftUpdate = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .firestore.document(CollectionName.shifts + '/{ShiftId}')
  .onUpdate(async (snap) => {
    try {
      const shiftOldData = snap?.before?.data() as IShiftsCollection;

      const shiftNewData = snap.after.data() as IShiftsCollection;

      await shiftNewData;
      //* To send email to employees who have been removed from a shift
      await sendEmailToEmpWhoHasBeenRemovedFromShift(
        shiftOldData,
        shiftNewData
      );
      await sendEmailToEmpWhoHasCompletedShift(shiftOldData, shiftNewData);
    } catch (error) {
      console.log(error);
    }
  });
