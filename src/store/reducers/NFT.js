let initialState = {
    tokenId: 0,
    boughtNFT: {},
    nftMetadata: {},
    shopifyOrder: {},
    irlPlanterTime: 0,
    currentSalePrice: 0,
    nextSaleStartTime: 0, saleStage: '',

    TokenABI: {}, TokenAddress: '',
    CrowdSaleABI: {}, CrowdSaleAddress: '',

    // <=================== IRL Planters ===================>
    irlPlantersJSON: [], claimableReward: {},
    claimedRewards: {}, myIrlPlanters: {},

    cartItems: JSON.parse(localStorage.getItem('cart')) || {},
};

const NFT = (state = initialState, { type, payload }) => {
    switch (type) {

        case 'SET_METADATA':
            return {
                ...state,
                nftMetadata: payload || {},
            };

        case 'SET_SMARTCONTRACT':
            return {
                ...state,
                nextSaleStartTime: payload?.['nextSaleStartTime'],
                saleStage: payload?.['saleStage'],
                currentSalePrice: payload?.['currentSalePrice'],

                TokenABI: payload?.['TokenABI'],
                TokenAddress: payload?.['TokenAddress'],
                CrowdSaleABI: payload?.['CrowdSaleABI'],
                CrowdSaleAddress: payload?.['CrowdSaleAddress'],
                irlPlanterTime : payload?.['irlPlanterTime'],
                irlPlantersJSON: payload?.['irlplanters'],
            };

        case 'SET_CART_ITEMS':
            localStorage.setItem('cart', JSON.stringify(payload));
            return {
                ...state,
                cartItems: payload || {},
            };

        case 'SET_BOUGHT_NFT':
            return {
                ...state,
                boughtNFT: payload,
            };

        case 'SET_SHOPIFY':
            return {
                ...state,
                shopifyOrder: payload,
            };

        case 'SET_CLAIMABLE_REWARDS':
            return {
                ...state,
                claimableReward: payload,
            };

        case 'SET_CLAIMED_REWARDS':
            return {
                ...state,
                claimedRewards: payload,
            };

        case 'SET_MY_IRL_PLANTERS':
            return {
                ...state,
                myIrlPlanters: payload,
            };

        default:
            return state;
    }
};

export default NFT;