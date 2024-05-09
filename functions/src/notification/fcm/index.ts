import { BaseMessage } from 'firebase-admin/lib/messaging/messaging-api';
import * as functions from 'firebase-functions';
import { securityAppAdmin } from '../../methods/firebaseInit';

export const sendFCMNotification = async (
  payload: BaseMessage,
  tokens: string[]
) => {
  const message = {
    ...payload,
    tokens,
  };

  await securityAppAdmin
    .messaging()
    .sendEachForMulticast(message)
    .then((response) => {
      // Response is a message ID string.
      functions.logger.log('Successfully sent message:', response);
    })
    .catch((error) => {
      functions.logger.log('Error sending message:', error);
    });
};
