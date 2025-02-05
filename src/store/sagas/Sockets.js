// import { eventChannel } from 'redux-saga';
// import { take, call, put, } from 'redux-saga/effects';

// import { socket } from '../config';

// const createSocket = socket => eventChannel((emit) => {

//     //********** /* NFT DATA SOCKETS */ **********//
//     // socket.on('nft:data', data => {
//     //     emit(setNFTdata(data))
//     // });

//     return () => {
//         // socket.off(`all_prices`, () => emit());
//     }
// });

// export default function* listenSockets() {
//     const socketChannel = yield call(createSocket, socket);
//     while (true) {
//         let action = yield take(socketChannel);
//         if (action) yield put(action);
//     }
// };
