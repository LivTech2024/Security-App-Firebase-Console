import * as functions from 'firebase-functions';
import { CollectionName } from '../@types/enum';
import {
  ILoggedInUsersCollection,
  IMessagesCollection,
} from '../@types/database';
import { firestore } from 'firebase-admin';
import { sendFCMNotification } from '../notification/fcm';

export const messageCreate = functions.firestore
  .document(CollectionName.messages + '/{MessageId}')
  .onCreate(async (snap) => {
    try {
      const messageData = snap.data() as IMessagesCollection;
      const { MessageReceiversId, MessageData } = messageData;

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
                if (data.LoggedInNotifyFcmToken) {
                  fcmTokens.push(data.LoggedInNotifyFcmToken);
                }
              });
            }
          })
        );

        if (fcmTokens.length > 0) {
          await sendFCMNotification(
            { notification: { body: MessageData, title: 'New message' } },
            fcmTokens
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
