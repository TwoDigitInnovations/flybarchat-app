import { io } from 'socket.io-client';

const connectionConfig = {
  reconnection: true,
  transports: ['websocket'],
};
const url = 'https://api.flaychatbar.com'

export const socket = io(url, connectionConfig);


