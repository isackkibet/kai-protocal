import { readFile } from "node:fs/promises";
import { network } from "hardhat";
import { formatUnits, getAddress } from "viem";

const walletAddress = process.env.WALLET_ADDRESS;
if (!walletAddress) {
  throw new Error("Set WALLET_ADDRESS to the Core Wallet address to query.");
}

const deployments = JSON.parse(
  await readFile(new URL("../deployments.json", import.meta.url), "utf8"),
) as { contracts: { nuvariToken: { address: `0x${string}` } } };
const { viem } = await network.create();
const token = await viem.getContractAt("NuvariToken", deployments.contracts.nuvariToken.address);
const balance = await token.read.balanceOf([getAddress(walletAddress)]);

console.log(`NVR balance: ${formatUnits(balance, 18)}`);