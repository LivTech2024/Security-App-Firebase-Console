/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


export const securityAppAdmin = admin.initializeApp(functions.config().firebase);
