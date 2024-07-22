import { messageCreate } from './triggers/messageTrigger';
import { notificationTrigger } from './triggers/notificationTrigger';
import { shiftExchangeHandler } from './triggers/shiftExchangeTrigger';
import { handleShiftOfferChanges } from './triggers/shiftofferTrigger';
import { shiftUpdate } from './triggers/shiftTrigger';

export const shiftUpdateMain = shiftUpdate;
export const messageCreateMain = messageCreate;
export const shiftexchange = shiftExchangeHandler;
export const shiftoffer = handleShiftOfferChanges;

export const notification = notificationTrigger;
