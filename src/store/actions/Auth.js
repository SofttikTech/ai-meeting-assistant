export const signIn = (data) => ({
  type: 'SIGN_IN',
  payload: data,
});

export const signInData = (data) => ({
  type: 'SIGN_IN_DATA',
  payload: data,
});

export const toggleLoader = (data) => ({
  type: 'TOGGLE_LOADER',
  payload: data,
});

export const signOut = () => ({
  type: 'SIGN_OUT',
});

export const signUp = (data) => ({
  type: 'SIGN_UP',
  payload: data,
});

export const signUpData = (data) => ({
  type: 'SIGN_UP_DATA',
  payload: data,
});

export const checkNetwork = (data) => ({
  type: 'CHECK_NETWORK',
  payload: data,
});

export const toggleReviewCartModal = (data) => ({
  type: 'TOGGLE_REVIEW_CART_MODAL',
  payload: data,
});

export const toggleBuyNFTModal = (data) => ({
  type: 'TOGGLE_BUY_NFT_MODAL',
  payload: data,
});

export const setisCartNFTs = (data) => ({
  type: 'SET_IS_CART_NFTS',
  payload: data,
});

export const addToAllowList = (data) => ({
  type: 'ADD_TO_ALLOWLIST',
  payload: data,
});

export const getUserProfile = (data) => ({
  type: 'GET_USER_PROFILE',
});

export const setUserProfile = (data) => ({
  type: 'SET_USER_PROFILE',
  payload: data,
});

export const uploadProfilePicture = (data) => ({
  type: 'UPLOAD_PROFILE_PICTURE',
  payload: data,
});

export const uploadProfilePictureSuccess = (data) => ({
  type: 'UPLOAD_PROFILE_PICTURE_SUCCESS',
  payload: data,
});

export const submitAllowList = (data) => ({
  type: 'SUBMIT_ALLOWLIST',
  payload: data,
});

export const setAllowListLoader = (data) => ({
  type: 'SET_ALLOWLIST_LOADER',
  payload: data,
});


export const toggleGoogleAnalytics = (data) => ({
  type: 'TOGGLE_GOOGLE_ANALYTICS',
  payload: data,
});