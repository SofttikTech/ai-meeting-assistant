import { setToken } from "../axios";

let initialState = {
  isLoader: false,
  isNetwork: true,
  userProfile: null,
  isCartNFTs: false,
  buyNFTModal: false,
  reviewCartModal: false,
  isAllowListLoader: false,
  isGoogleAnalytics: false,
  userProfileImage: '',
  auth: localStorage.getItem('auth'),
  publicAddress: localStorage.getItem('publicAddress'),
}

const Auth = (state = initialState, { type, payload }) => {
  switch (type) {

    case 'SIGN_IN_DATA':
      setToken(payload.token);
      localStorage.setItem('auth', payload.token);
      localStorage.setItem('publicAddress', payload.publicAddress);
      return {
        ...state,
        auth: payload.token,
        publicAddress: payload.publicAddress
      };

    case 'SIGN_UP_DATA':
      setToken(payload.token);
      localStorage.setItem('auth', payload.token);
      return {
        ...state,
        auth: payload.token,
      };

    case 'TOGGLE_LOADER':
      return {
        ...state,
        isLoader: payload,
      };

    case 'SIGN_OUT':
      localStorage.removeItem('auth');
      localStorage.removeItem('publicAddress');
      return {
        ...state,
        auth: null,
        publicAddress: null
      };

    case 'CHECK_NETWORK':
      return {
        ...state,
        isNetwork: payload,
      };

    case 'TOGGLE_REVIEW_CART_MODAL':
      return {
        ...state,
        reviewCartModal: payload,
      };

    case 'TOGGLE_BUY_NFT_MODAL':
      return {
        ...state,
        buyNFTModal: payload,
      };

    case 'SET_IS_CART_NFTS':
      return {
        ...state,
        isCartNFTs: payload,
      };

    case 'SET_USER_PROFILE':
      return {
        ...state,
        userProfile: payload,
      };

    case 'UPLOAD_PROFILE_PICTURE_SUCCESS':
      return {
        ...state,
        userProfileImage: payload,
      };

    case 'SET_ALLOWLIST_LOADER':
      return {
        ...state,
        isAllowListLoader: payload,
      };

    case 'TOGGLE_GOOGLE_ANALYTICS':
      return {
        ...state,
        isGoogleAnalytics: payload,
      };

    default:
      return state;
  }
};

export default Auth;