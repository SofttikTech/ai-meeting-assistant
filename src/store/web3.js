import Web3 from "web3";

// web3
const provider = window.ethereum;
const web3 = new Web3(provider);

export { web3 };