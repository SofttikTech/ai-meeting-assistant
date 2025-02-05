export const getMetadata = (data) => ({
    type: 'GET_METADATA',
    payload: data,
});

export const setMetadata = (data) => ({
    type: 'SET_METADATA',
    payload: data,
});

export const getSmartContracts = () => ({
    type: 'GET_SMARTCONTRACT'
});

export const setSmartContracts = (data) => ({
    type: 'SET_SMARTCONTRACT',
    payload: data,
});

export const setCartItems = (data) => ({
    type: 'SET_CART_ITEMS',
    payload: data
});

export const setBoughtNFT = (data) => ({
    type: 'SET_BOUGHT_NFT',
    payload: data
});

export const setShopify = (data) => ({
    type: 'SET_SHOPIFY',
    payload: data
});




// ================ REWARDS ================

export const getClaimableRewards = () => ({
    type: 'GET_CLAIMABLE_REWARDS',
});

export const setClaimableRewards = (data) => ({
    type: 'SET_CLAIMABLE_REWARDS',
    payload: data
});

export const claimRewards = (data) => ({
    type: 'CLAIM_REWARDS',
    payload: data
});

export const getClaimedRewards = () => ({
    type: 'GET_CLAIMED_REWARDS',
});

export const setClaimedRewards = (data) => ({
    type: 'SET_CLAIMED_REWARDS',
    payload: data
});

export const getMyIrlPlanters = () => ({
    type: 'GET_MY_IRL_PLANTERS',
});

export const setMyIrlPlanters = (data) => ({
    type: 'SET_MY_IRL_PLANTERS',
    payload: data
});