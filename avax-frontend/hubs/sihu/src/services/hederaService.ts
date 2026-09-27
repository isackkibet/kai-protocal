import { Client, PrivateKey, PublicKey } from "@hashgraph/sdk";

/**
 * Generates a completely new ED25519 Private Key for the Hedera Network.
 */
export function generateTestnetWallet() {
  const privateKey = PrivateKey.generateED25519();
  const publicKey = privateKey.publicKey;

  return {
    privateKeyStr: privateKey.toString(),
    publicKeyStr: publicKey.toString(),
  };
}

/**
 * Initializes a Hedera Testnet Client using the provided account ID and private key.
 * Used to submit transactions to the network.
 */
export function initHederaClient(accountId: string, privateKeyStr: string): Client {
  const accountIdFormatted = accountId; // e.g. "0.0.12345"
  const client = Client.forTestnet();
  
  // Set the operator (the account that will pay the transaction fee)
  client.setOperator(accountIdFormatted, PrivateKey.fromString(privateKeyStr));
  
  return client;
}
