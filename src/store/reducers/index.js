import { combineReducers } from "redux";

import NFT from "./NFT.js";
import Auth from "./Auth.js";

export default combineReducers({ Auth, NFT });