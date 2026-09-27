require('dotenv').config();
const { Client, AccountId, PrivateKey } = require("@hashgraph/sdk");

function createClient() {
    if (!process.env.MY_ACCOUNT_ID || !process.env.MY_PRIVATE_KEY) {
        console.warn("⚠️  HEDERA CREDENTIALS MISSING IN .env FILE");
        console.warn("Using default testnet client (limited functionality without credentials)");
        return Client.forTestnet();
    }

    const myAccountId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
    const myPrivateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    return client;
}

module.exports = {
    createClient
};
