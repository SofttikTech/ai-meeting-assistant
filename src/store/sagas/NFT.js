import axios from 'axios';
import EventBus from 'eventing-bus';
import { all, takeEvery, call, put } from 'redux-saga/effects';

import { toggleLoader, } from "../actions/Auth";
import { setMetadata, setSmartContracts, setShopify, setClaimableRewards, setClaimedRewards, setMyIrlPlanters } from "../actions/NFT";

function* getMetadata({ payload }) {
    const { error, response } = yield call(postCall, { path: `/nft/metadata`, payload });
    if (error) EventBus.publish('error', error.response.data.message);
    else if (response) yield put(setMetadata(response.data.body));
    yield put(toggleLoader(false));
}

function* getSmartContracts() {
    const { error, response } = yield call(getCall, '/nft/smartContracts');
    console.log('**** response', response);
    if (error) EventBus.publish('error', error.response.data.message);
    else if (response) yield put(setSmartContracts(response.data.body));
}

function* setBoughtNFT({ payload }) {
    if (!payload?.['nftId']) return;
    const { error, response } = yield call(postCall, { path: `/nft/buyNFT`, payload });
    if (error) EventBus.publish('error', error.response.data.message);
    else yield put(setShopify(response.data.body));
    yield put(toggleLoader(false));
}

function* getClaimableRewards() {
    const { error, response } = yield call(getCall, '/nft/claimableRewards');

    if (error) {
        const errorMessage = error.response?.data?.message ?? '';
        if (errorMessage !== "You donot have any claimable rewards") EventBus.publish("error", errorMessage);
        else yield put(setClaimableRewards({}));
    } else if (response) {
        const responseData = response.data?.body ?? {};
        yield put(setClaimableRewards(responseData));
        yield put(toggleLoader(false));
    }
}


function* claimRewards({ payload }) {
    if (!payload) return;
    const { error, response } = yield call(postCall, { path: `/nft/claimRewards`, payload });
    if (error) EventBus.publish('error', error['response']['data']['message']);
    else {
        EventBus.publish('success', 'Reward claimed successfully');
        yield put(setClaimableRewards({}));
        yield put(toggleLoader(false));
    }
}

function* getClaimedRewards() {
    const { error, response } = yield call(getCall, '/nft/claimedRewards');
    if (error) console.error(error['response']['data']['message']);
    else if (response) yield put(setClaimedRewards(response['data']['body']));
}

function* getMyIrlPlanters() {
    const { error, response } = yield call(getCall, '/nft/myIrlPlanters');
    console.log("*** function*getMyIrlPlanters ~ response:", response)
    if (error) console.error(error['response']['data']['message']);
    else if (response) yield put(setMyIrlPlanters(response['data']['body']));
}

function* actionWatcher() {
    yield takeEvery('GET_METADATA', getMetadata);
    yield takeEvery('CLAIM_REWARDS', claimRewards);
    yield takeEvery('SET_BOUGHT_NFT', setBoughtNFT);
    yield takeEvery('GET_SMARTCONTRACT', getSmartContracts);
    yield takeEvery('GET_MY_IRL_PLANTERS', getMyIrlPlanters);
    yield takeEvery('GET_CLAIMED_REWARDS', getClaimedRewards);
    yield takeEvery('GET_CLAIMABLE_REWARDS', getClaimableRewards);
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