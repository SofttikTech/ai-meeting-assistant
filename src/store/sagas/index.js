import '../axios';
import NFT from './NFT';
import Auth from './Auth';
// import Sockets from './Sockets';

import { all } from 'redux-saga/effects';

export default function* rootSaga() {
  yield all([ Auth(), NFT()]);
}
