import axios from 'axios';

/* -- set app title --*/
const AppTitle = 'Frontend Emotional-Health-Counselling-App NFT';

/* -- set app mode -- */
// const AppMode = [''];
const AppMode = [''];
// const AppMode = ['production'];

/* -- set API URLs --*/
const production = 'https://server.pepeearpet.io';
const development = 'https://dserver.pepeearpet.io';

let env = AppMode[0] || 'development', network, networkId, message, explorer, opensea, stripeKey, baseURL, URI, REACT_APP_TEMPLATE_CLIENT_ID;
switch (AppMode[0]) {
  case 'development':
    network = 'LineaSepolia';
    networkId = 59141;
    baseURL = development;
    explorer = 'https://rpc.sepolia.linea.build';
    message = 'Please switch to Linea Sepolia Testnet';
    opensea = 'https://opensea.io/assets/ethereum';
    REACT_APP_TEMPLATE_CLIENT_ID = 'd4e861e5e630a3d6aeb6b5197f45ac5c';
    stripeKey = 'pk_test_51Ot9naRoOxvrBMYQxM2ilgyxmdonBrpUfMTblNcWvkFQnKkjk4B31f9d9O6dyu1RXEnrckvE68RDG27vQEz8e0Ym002fxzrrO8';
    break;
  case 'production':
    network = 'Ethereum';
    networkId = 1;
    baseURL = production;
    explorer = 'https://etherscan.io/'
    message = 'Please switch to Ethereum Mainnet';
    opensea = 'https://opensea.io/assets/ethereum';
    REACT_APP_TEMPLATE_CLIENT_ID = 'd4e861e5e630a3d6aeb6b5197f45ac5c';
    stripeKey = 'pk_live_51Ot9naRoOxvrBMYQpKiYPEFE5cPMEkb0u8HzWgpKxJbJzc5AB7QHM7HLDBZrNKkmn3oOTsufLpvgUCrXJR6SAhEU001rNOpkYp'; // Add Stripe Production Key
    break;
  default:
    network = 'LineaSepolia';
    networkId = 59141;
    baseURL = 'http://localhost:4000';
    explorer = 'https://rpc.sepolia.linea.build';
    message = 'Please switch your network to Linea Sepolia Testnet';
    opensea = 'https://testnets.opensea.io/assets/LineaSepolia';
    REACT_APP_TEMPLATE_CLIENT_ID = 'd4e861e5e630a3d6aeb6b5197f45ac5c';
    stripeKey = 'pk_test_51Ot9naRoOxvrBMYQxM2ilgyxmdonBrpUfMTblNcWvkFQnKkjk4B31f9d9O6dyu1RXEnrckvE68RDG27vQEz8e0Ym002fxzrrO8';
    break;
};

const BASE_URL = "https://timyung.dev/api";
// const BASE_URL = "http://127.0.0.1:4000/api";

const API = {
    selectCard: `${BASE_URL}/select-card`,
    connectionDetails: `${BASE_URL}/connection_details`
};

// API Methods

const selectCard = async (cardNumber) => {
    try {
        const response = await axios.post(API.selectCard, { cardNumber }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error sending card number:", error);
        throw error;
    }
};

const fetchConnectionDetails = async () => {
    try {
        const response = await fetch(API.connectionDetails, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch connection details');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch connection details:", error);
        throw error;
    }
};


let ApiUrl = `${baseURL}/api/`;
export { AppTitle, ApiUrl, baseURL, env, network, networkId, message, opensea, stripeKey, URI, REACT_APP_TEMPLATE_CLIENT_ID, selectCard, fetchConnectionDetails};