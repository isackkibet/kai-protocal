# Nuvari Token on Avalanche

This repository currently contains the first deployable slice of the Nuvari ecosystem: a capped ERC-20 `NVR` token with role-controlled minting and burning. It is configured for a local Hardhat node and Avalanche Fuji C-Chain. The larger PRD features, including the stablecoin collateral engine, ERC-4626 vaults, AMM, wallet UI, and x402 escrow, should be added as separate audited modules rather than represented by an incomplete placeholder.

## Prerequisites

- Node.js 22 or newer
- Core Wallet or MetaMask
- Fuji AVAX from the [Avalanche Fuji faucet](https://faucet.avax.network/)

Install dependencies:

```bash
npm install
```

## Local deployment

In a first terminal, start the local chain:

```bash
npx hardhat node
```

In a second terminal, deploy the token:

```bash
npm run deploy:localhost
```

The command writes `deployments.json` and prints the token address. Add that address as a custom token in Core Wallet while connected to the local Hardhat network (`http://127.0.0.1:8545`, chain ID `31337`).

## Fuji deployment

Copy `.env.example` to `.env` and set `PRIVATE_KEY` to a Fuji-funded deployer key. Keep `.env` private and never use a wallet holding real funds.

```bash
npm run deploy:fuji
```

In Core Wallet, switch to **Avalanche Fuji Testnet** and import the printed token address as a custom token. The token uses 18 decimals and the symbol `NVR`. The deployment output includes a Snowtrace testnet link.

## Query a balance

Set `WALLET_ADDRESS` in `.env` to the Core Wallet address to inspect, then run:

```bash
npm run balance:fuji
```

For a local deployment, use the same command with `--network localhost` after setting `WALLET_ADDRESS` to one of the accounts printed by `npx hardhat node`.

## Test

```bash
npm run build
npm test
```

The current contract has a fixed maximum supply of 50,000,000 NVR. The deployer receives the initial supply and the `MINTER_ROLE`; all other accounts are unable to mint.
# Sample Hardhat 3 Project (`node:test` and `viem`)

This project showcases a Hardhat 3 project using the native Node.js test runner (`node:test`) and the `viem` library for Ethereum interactions.

To learn more about Hardhat 3, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3](https://hardhat.org/hardhat3-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html), the new Node.js native test runner, and [`viem`](https://viem.sh/).
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
