/* eslint-disable prettier/prettier */
import { io } from 'socket.io-client';

const connectionConfig = {
  transports: ['websocket'],
};
// const url = Constants.server;
// const url = 'http://192.168.0.187:8001';
const url = 'https://api.flaychatbar.com';
// const url = 'http://192.168.85.93:3000';
// const url = 'http://10.0.2.2:8001';
export const socket = io(url, connectionConfig);
