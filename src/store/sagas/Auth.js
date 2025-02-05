import axios from 'axios';
import EventBus from 'eventing-bus';
import { all, takeEvery, call, put } from 'redux-saga/effects';

import { toggleLoader, toggleGoogleAnalytics, setAllowListLoader, signInData, setUserProfile, uploadProfilePictureSuccess } from "../actions/Auth";


function* signIn({ payload }) {
  try {
    const { error, response } = yield call(postCall, { path: '/users/loginWithWallet', payload });
    if (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during signin.';
      EventBus.publish('error', errorMessage);
    } else if (response) yield put(signInData(response.data.body));
  } catch (error) {
    console.error('Unexpected error during signin:', error);
  }
}

function* addToAllowList({ payload }) {
  try {
    const { error, response } = yield call(postCall, { path: '/users/addToAllowlist', payload });
    if (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during Allowlist Request.';
      EventBus.publish('error', errorMessage);
    } else if (response) {
      yield put(toggleGoogleAnalytics(true));
      const successMessage = 'Allowlist Request Sent Successfully';
      EventBus.publish('success', successMessage);
    }
  } catch (error) {
    console.error('Unexpected error during add user in allowlist:', error);
  }
}

function* getUserProfile() {
  const { error, response } = yield call(getCall, `/users/getProfile`);
  if (error) EventBus.publish('error', error.response.data.message);
  else if (response) yield put(setUserProfile(response.data.body));
  yield put(toggleLoader(false));
}

function* uploadUserProfilePicture({ payload }) {
  try {
    const { error, response } = yield call(postCall, { path: '/users/uploadProfilePicture', payload });

    if (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during uploading profile picture';
      EventBus.publish('error', errorMessage);
    } else if (response) {
      const successMessage = 'Upload Profile Picture Successfully';
      yield put(uploadProfilePictureSuccess(response['data']['body']["profilePicture"]));
      EventBus.publish('success', successMessage);
    }
  } catch (error) {
    console.error('Unexpected error during upload profile picture:', error);
  }
}

function* submitAllowList({ payload }) {
  try {
    const { error, response } = yield call(postCall, { path: '/users/allowList', payload });
    if (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during Allowlist Request.';
      EventBus.publish('error', errorMessage);
    } else if (response) {
      yield put(setAllowListLoader(false));
      yield put(toggleGoogleAnalytics(true));
      const successMessage = response?.data?.message || 'Allowlist Request Sent Successfully';
      EventBus.publish('success', successMessage);
    }
  } catch (error) {
    console.error('Unexpected error during submit allowlist:', error);
  }
}

function* actionWatcher() {
  yield takeEvery('SIGN_IN', signIn); // signin Action
  yield takeEvery('GET_USER_PROFILE', getUserProfile);
  yield takeEvery('SUBMIT_ALLOWLIST', submitAllowList);
  yield takeEvery('ADD_TO_ALLOWLIST', addToAllowList);
  yield takeEvery('UPLOAD_PROFILE_PICTURE', uploadUserProfilePicture);
};

export default function* rootSaga() {
  yield all([actionWatcher()]);
};

function postCall({ path, payload }) {
  return axios
    .post(path, payload)
    .then(response => ({ response }))
    .catch(error => {
      if (error.response.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function getCall(path) {
  return axios
    .get(path)
    .then(response => ({ response }))
    .catch(error => {
      if (error.response.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function deleteCall(path) {
  return axios
    .delete(path)
    .then(response => ({ response }))
    .catch(error => {
      if (error.response.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function putCall({ path, payload }) {
  return axios
    .put(path, payload)
    .then(response => ({ response }))
    .catch(error => {
      if (error.response.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};
