import * as functions from 'firebase-functions';
import { CollectionName } from '../@types/enum';
import {
  ILoggedInUsersCollection,
  INotificationData,
  IShiftExchangeCollection,
  IShiftsCollection,
  ShiftOffer,
} from '../@types/database';
import { firestore } from 'firebase-admin';
import { sendFCMNotification } from '../notification/fcm';
import { BaseMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getEmpDetails, getShiftDocs } from '../utils/firebaseUtils';

export const handleShiftOfferChanges = functions.firestore
  .document('ShiftOffer/{shiftOfferId}')
  .onWrite(async (change, context) => {
    const shiftOfferId = context.params.shiftOfferId;
    console.log(`ShiftOfferId: ${shiftOfferId}`);

    const beforeData = change.before.exists
      ? (change.before.data() as ShiftOffer)
      : null;
    const afterData = change.after.exists
      ? (change.after.data() as ShiftOffer)
      : null;

    console.log(`Before Data: ${JSON.stringify(beforeData)}`);
    console.log(`After Data: ${JSON.stringify(afterData)}`);

    const fcmTokens: string[] = [];
    let shiftData;
    let empData;
    let notificationMessage;

    if (afterData) {
      try {
        shiftData = await getShiftDocs(afterData.ShiftOfferShiftId);
        empData = await getEmpDetails(afterData.ShiftOfferSenderId);
        notificationMessage = `A new shift offer for ${shiftData.ShiftName}.`;

        console.log(`Shift Data: ${JSON.stringify(shiftData)}`);
        console.log(`Employee Data: ${JSON.stringify(empData)}`);

        if (
          afterData.ShiftOfferStatus === 'started' ||
          (beforeData &&
            afterData.ShiftOfferStatus !== beforeData.ShiftOfferStatus)
        ) {
          const notificationData: INotificationData = {
            NotificationMessage: 'Shift Offer Request',
            NotificationCreatedAt: firestore.Timestamp.fromDate(new Date()),
            NotificationType: 'SHIFTOFFER',
            NotificationStatus: afterData.ShiftOfferStatus,
            NotificationIds: [
              afterData.ShiftOfferSenderId ?? '',
              afterData.ShiftOfferAcceptedId ?? '',
            ],
            NotificationId: '', // Temporary placeholder
            NotificationCompanyId: afterData.ShiftOfferCompanyId,
            NotificationSenderName: empData.EmployeeName,
            ShiftOfferData: {
              ShiftOfferAcceptedId: afterData.ShiftOfferAcceptedId,
              ShiftOfferCompanyId: afterData.ShiftOfferCompanyId,
              ShiftOfferLocation: shiftData.ShiftLocationName ?? '',
              ShiftOfferId: afterData.ShiftOfferId,
              ShiftOfferShiftName: shiftData.ShiftName,
              ShiftOfferTime: `${shiftData.ShiftStartTime} - ${shiftData.ShiftEndTime}`,
              ShiftOfferDate: firestore.Timestamp.fromDate(new Date()),
            },
          };
          const notificationRef = firestore()
            .collection(CollectionName.notification)
            .doc();

          notificationData.NotificationId = notificationRef.id;

          await notificationRef.set(notificationData);
          const addFcmTokensForUser = async (userId: string) => {
            console.log(`Fetching FCM tokens for user: ${userId}`);
            const loggedInDocSnapshot = await firestore()
              .collection(CollectionName.loggedInUsers)
              .where('LoggedInCompanyId', '==', afterData.ShiftOfferCompanyId)
              .orderBy('LoggedInCreatedAt', 'desc')
              .limit(5)
              .get();

            const loggedInDeviceData = loggedInDocSnapshot.docs.map(
              (doc) => doc.data() as ILoggedInUsersCollection
            );

            loggedInDeviceData.forEach((data) => {
              if (
                data.LoggedInNotifyFcmToken &&
                !fcmTokens.includes(data.LoggedInNotifyFcmToken)
              ) {
                fcmTokens.push(data.LoggedInNotifyFcmToken);
              }
            });
            console.log(`Fetched FCM tokens: ${fcmTokens}`);
          };

          await addFcmTokensForUser(afterData.ShiftOfferSenderId);

          console.log(
            `Notification document created with ID: ${notificationRef.id}`
          );

          if (fcmTokens.length > 0) {
            const message: BaseMessage = {
              notification: {
                title: 'Shift Offer',
                body: notificationMessage,
              },
            };

            await sendFCMNotification(message, fcmTokens);
            console.log('FCM Notification sent successfully');
          } else {
            console.log('No FCM tokens found');
          }
        }
      } catch (error) {
        console.error('Error processing shift offer:', error);
      }
    }
  });
