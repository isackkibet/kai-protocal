import {
  ChainNotConfiguredError,
  ConnectorNotConnectedError,
  createConnector,
} from '@wagmi/core';
import {
  custom,
  fromHex,
  getAddress,
  http,
  numberToHex,
  RpcRequestError,
  SwitchChainError,
  type Address,
  type EIP1193Provider,
  type Hex,
} from 'viem';
import { type LocalAccount, privateKeyToAccount } from 'viem/accounts';
import { rpc } from 'viem/utils';

export type KaiPrivateKeyConnectorParameters = {
  privateKey: Hex;
};

kaiPrivateKeyConnector.type = 'kaiPrivateKey' as const;

export function kaiPrivateKeyConnector(parameters: KaiPrivateKeyConnectorParameters) {
  const account: LocalAccount = privateKeyToAccount(parameters.privateKey);
  const accountAddress = getAddress(account.address);

  let connected = false;
  let connectedChainId: number | undefined;

  return createConnector<EIP1193Provider>((config) => ({
    id: 'kaiPrivateKey',
    name: 'KAI Wallet',
    type: kaiPrivateKeyConnector.type,
    async setup() {
      connectedChainId = config.chains[0].id;
    },
    async connect({ chainId } = {}) {
      const provider = await this.getProvider();
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      let currentChainId = await this.getChainId();
      if (chainId && currentChainId !== chainId) {
        const chain = await this.switchChain({ chainId });
        currentChainId = chain.id;
      }
      connected = true;
      return {
        accounts: accounts.map((address) => getAddress(address)),
        chainId: currentChainId,
      };
    },
    async disconnect() {
      connected = false;
    },
    async getAccounts() {
      if (!connected) throw new ConnectorNotConnectedError();
      const provider = await this.getProvider();
      const accounts = await provider.request({ method: 'eth_accounts' });
      return accounts.map((address) => getAddress(address));
    },
    async getChainId() {
      const provider = await this.getProvider();
      const hexChainId = await provider.request({ method: 'eth_chainId' });
      return fromHex(hexChainId as Hex, 'number');
    },
    async isAuthorized() {
      return true;
    },
    async switchChain({ chainId }) {
      const provider = await this.getProvider({ chainId });
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(chainId) }],
      });
      return chain;
    },
    async getProvider({ chainId } = {}) {
      const chain = config.chains.find((x) => x.id === chainId) ?? config.chains[0];
      const rpcUrl = chain.rpcUrls.default.http[0];
      const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

      const request: EIP1193Provider['request'] = async ({ method, params }) => {
        // account / chain methods
        if (method === 'eth_chainId') return numberToHex(connectedChainId ?? chain.id);
        if (method === 'eth_requestAccounts' || method === 'eth_accounts')
          return [accountAddress];

        // signing methods
        if (method === 'personal_sign') {
          const [message] = params as [Hex, Address];
          return account.signMessage({ message });
        }
        if (method === 'eth_sign') {
          const [address, message] = params as [Address, Hex];
          return account.signMessage({ message, address });
        }
        if (method === 'eth_signTypedData' || method === 'eth_signTypedData_v4') {
          const [, typedData] = params as [Address, string];
          return account.signTypedData(
            JSON.parse(typedData) as Parameters<LocalAccount['signTypedData']>[0],
          );
        }

        // wallet methods
        if (method === 'wallet_switchEthereumChain') {
          const [{ chainId: hexChainId }] = params as [{ chainId: Hex }];
          connectedChainId = fromHex(hexChainId, 'number');
          this.onChainChanged(connectedChainId.toString());
          return null;
        }
        if (method === 'wallet_watchAsset') return true;

        // transaction signing
        if (method === 'eth_sendTransaction') {
          const [tx] = params as [{ to?: Address; data?: Hex; value?: bigint }];
          const request = await publicClient.prepareTransactionRequest({
            ...tx,
            to: tx.to ?? accountAddress,
            account,
            chain: publicClient.chain,
          });
          const signed = await account.signTransaction(request);
          const hash = await publicClient.sendRawTransaction({
            serializedTransaction: signed,
          });
          return hash;
        }
        if (method === 'eth_signTransaction') {
          const [tx] = params as [{ to?: Address; data?: Hex; value?: bigint }];
          const request = await publicClient.prepareTransactionRequest({
            ...tx,
            to: tx.to ?? accountAddress,
            account,
            chain: publicClient.chain,
          });
          const signed = await account.signTransaction(request);
          return { raw: signed, tx: request };
        }

        // forward anything else (reads, gas estimation, logs, ...) to the RPC node
        const body = { method, params: params as unknown };
        const { error, result } = await rpc.http(rpcUrl, { body });
        if (error) throw new RpcRequestError({ body, error, url: rpcUrl });
        return result;
      };

      return custom({ request })({ retryCount: 0 }) as unknown as EIP1193Provider;
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else config.emitter.emit('change', { accounts: accounts.map((x) => getAddress(x)) });
    },
    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit('change', { chainId });
    },
    async onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}