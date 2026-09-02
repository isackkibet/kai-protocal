import "dotenv/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

// Normalise a raw hex private key → 0x-prefixed 32-byte hex string.
// Returns undefined if the value is missing or malformed so Hardhat
// skips account injection on networks that don't need it.
function parsePrivateKey(raw: string | undefined): `0x${string}` | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return undefined;
  return `0x${hex}`;
}

const privateKey = parsePrivateKey(
  process.env.AVAX_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY ?? process.env.PRIVATE_KEY,
);

const fujiRpc =
  process.env.AVAX_RPC_URL ??
  process.env.FUJI_RPC_URL ??
  "https://api.avax-test.network/ext/bc/C/rpc";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          viaIR: true,
          optimizer: { enabled: true, runs: 200 },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    fuji: {
      type: "http",
      chainType: "l1",
      url: fujiRpc,
      chainId: 43113,
      accounts: privateKey ? [privateKey] : [],
    },
  },
});
