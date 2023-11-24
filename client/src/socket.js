import io from 'socket.io-client';
const sockets = io('http://localhost:3002')
// const sockets = io('/');
export default sockets;
