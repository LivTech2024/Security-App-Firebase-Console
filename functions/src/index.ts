import { compressUploadedImage } from './triggers/cloudStorageTrigger';
import { messageCreate } from './triggers/messageTrigger';
import { shiftUpdate } from './triggers/shiftTrigger';

export const shiftUpdateMain = shiftUpdate;

export const messageCreateMain = messageCreate;

export const imageUploadMain = compressUploadedImage;
