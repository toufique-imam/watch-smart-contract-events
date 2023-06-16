import { ContractABI } from "../utils/Contract";
import Web3 from 'web3'
import fetchQueue from "../utils/queue";

export const contractAddress = "0x179d1ebf5847a83c8754836f7782b901d37e5b04"

const web3Provider = new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/9fed6dde5c9b4ae0af834b1cb77e9a1d")
const web3 = new Web3(web3Provider)

export const contractInstance = new web3.eth.Contract(ContractABI, contractAddress)

export const getLatestBuyer = async () => {
    try {
        let buyer = await contractInstance.methods.latestBuyer().call()
        return String(buyer)
    } catch (e) {
        console.error("Error:", e);
    }
}
export const registerTransferListener = (listener) => {
    contractInstance.events.Transfer({
        filter: { from: contractAddress }, // filter for transfers from the contract
        fromBlock: 'latest' // start from the latest block
    })
        .on('data', (event) => {
            let transactionHash = event.transactionHash
            let { from, to, value } = event.returnValues;
            if (transactionHash) {
                listener([transactionHash, from, to, value])
            }
        })
}

export async function postToMongoDB(from, to, value, transactionHash) {
    try {
        const response = await fetchQueue('/api/set_transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: from,
                to: to,
                value: value,
                transactionHash: transactionHash
            }),
        });
        return response;
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
export async function getTransfersFromMongoDB() {
    try {
        const response = await fetchQueue('/api/get_transfer?limit=50', {
            method: 'GET',
        });
        return response;
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
export async function getMaxRewardFromMongoDB() {
    try {
        const response = await fetchQueue('/api/get_transfer?limit=1', {
            method: 'POST',
            body: JSON.stringify({
                limit: 1
            }),
        });
        return response;
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
export async function parseServerResponse(response) {
    try {
        if (!response || !response.ok) {
            return "Sorry, I'm not feeling well today. Try again later.";
        }
        const data = await response.json();
        if (data.error) {
            return data.error;
        }
        return data.result;
    } catch (error) {
        console.error('Error:', error);
        return "Sorry, I'm not feeling well today. Try again later.";
    }
}