const path = require('path');
const dotenv = require('dotenv');
require('@nomicfoundation/hardhat-ethers');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

function normalizePrivateKey(value) {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, '');
  const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('AVAX_PRIVATE_KEY must be a 32-byte hexadecimal private key.');
  }
  return `0x${hex}`;
}

const privateKey = normalizePrivateKey(
  process.env.AVAX_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY,
);

module.exports = {
  solidity: '0.8.20',
  networks: {
    hardhat: {},
    fuji: {
      url: process.env.AVAX_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};
