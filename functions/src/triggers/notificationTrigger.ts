import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { sendFCMNotification } from '../notification/fcm';
import { BaseMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { CollectionName } from '../@types/enum';
import {
  ILoggedInUsersCollection,
  INotificationData,
} from '../@types/database';

// Firestore trigger for document creation
export const notificationTrigger = functions.firestore
  .document(`${CollectionName.notification}/{NotificationId}`)
  .onCreate(async (snap) => {
    await handleNotification(snap.data() as INotificationData);
  });

// Firestore trigger for document updates
export const notificationStatusChangeTrigger = functions.firestore
  .document(`${CollectionName.notification}/{NotificationId}`)
  .onUpdate(async (change) => {
    const beforeData = change.before.data() as INotificationData;
    const afterData = change.after.data() as INotificationData;

    if (beforeData.NotificationStatus !== afterData.NotificationStatus) {
      await handleNotification(afterData);
    }
  });

// Helper function to handle notification sending
async function handleNotification(notificationData: INotificationData) {
  try {
    const {
      ShiftExchangeData,
      ShiftOfferData,
      NotificationType,
      NotificationMessage,
    } = notificationData;
    const fcmTokens: string[] = [];

    const addFcmTokensForUser = async (userId: string) => {
      const loggedInDocSnapshot = await firestore()
        .collection(CollectionName.loggedInUsers)
        .where('LoggedInUserId', '==', userId)
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
    };

    if (ShiftExchangeData) {
      await addFcmTokensForUser(ShiftExchangeData.ExchangeShiftRequestedId);
    } else if (ShiftOfferData) {
      await addFcmTokensForUser(ShiftOfferData.ShiftOfferCompanyId);
    }

    if (fcmTokens.length > 0) {
      const message: BaseMessage = {
        notification: {
          title:
            NotificationType === 'SHIFTEXCHANGE'
              ? 'Shift Exchange Request Update'
              : NotificationType === 'SHIFTOFFER'
                ? 'Shift Offer Update'
                : 'Notification',
          body: NotificationMessage,
        },
        data: {
          route: '/alert_screen',
        },
      };

      await sendFCMNotification(message, fcmTokens);
    }
  } catch (error) {
    console.error('Error sending FCM notification:', error);
  }
}
