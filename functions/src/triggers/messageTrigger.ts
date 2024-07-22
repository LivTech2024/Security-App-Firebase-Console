import * as functions from 'firebase-functions';
import { CollectionName } from '../@types/enum';
import {
  ILoggedInUsersCollection,
  IMessagesCollection,
} from '../@types/database';
import { firestore } from 'firebase-admin';
import { sendFCMNotification } from '../notification/fcm';
import { BaseMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { getEmpDetails } from '../utils/firebaseUtils';

export const messageCreate = functions.firestore
  .document(CollectionName.messages + '/{MessageId}')
  .onCreate(async (snap) => {
    try {
      const messageData = snap.data() as IMessagesCollection;
      const { MessageReceiversId, MessageData, MessageCreatedById } =
        messageData;
      const empdata = await getEmpDetails(MessageCreatedById);
      if (MessageReceiversId && Array.isArray(MessageReceiversId)) {
        const fcmTokens: string[] = [];

        await Promise.all(
          MessageReceiversId.map(async (receiversId) => {
            //*Fetch latest 5 loggedIn Device of user
            //* At most 5 device can receive notification
            const loggedInDocSnapshot = await firestore()
              .collection(`${CollectionName.loggedInUsers}`)
              .where('LoggedInUserId', '==', receiversId)
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
        const notificationData = {
          NotificationCreatedAt: firestore.FieldValue.serverTimestamp(),
          NotificationIds: MessageReceiversId,
          NotificationMessage: MessageData,
          NotificationStatus: 'pending',
          NotificationType: 'Message',
          NotificationCompanyId: empdata.EmployeeCompanyId,
          NotificationSenderName: empdata.EmployeeName,
          // or another appropriate type
        };

        await firestore()
          .collection(CollectionName.notification)
          .add(notificationData);

        if (fcmTokens.length > 0) {
          const message: BaseMessage = {
            notification: {
              title: 'New Message Received',
              body: MessageData,
            },
            data: {
              route: '/notification_screen',
            },
          };

          await sendFCMNotification(message, fcmTokens);
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
