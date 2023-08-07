import {
  AptosAccount,
  FaucetClient,
  BCS,
  AptosClient,
  TokenClient,
  MaybeHexString,
  OptionalTransactionArgs,
  getPropertyValueRaw,
  Types,
} from "aptos";

const NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

const getBalance = async (account: AptosAccount) => {
  const resources = await client.getAccountResources(account.address().hex());
  const aptosCoin = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
  let accountResource = resources.find((r) => r.type === aptosCoin);
  return BigInt((accountResource!.data as any).coin.value);
};

(async () => {
  const x = new AptosAccount();
  const y = new AptosAccount();
  const z = new AptosAccount();
  await faucetClient.fundAccount(x.address(), 100_000_000);
  await faucetClient.fundAccount(y.address(), 100_000_000);
  await faucetClient.fundAccount(z.address(), 100_000_000);

  console.log(`X balance: ${await getBalance(x)} octas`);
  console.log(`Y balance: ${await getBalance(y)} octas`);
  console.log(`Z balance: ${await getBalance(z)} octas`);

  const payload = {
    function: "0x1::aptos_account::transfer",
    type_arguments: [],
    arguments: [y.address(), 1000000],
  };

  const feePayerTxn = await client.generateFeePayerTransaction(
    x.address(),
    payload,
    z.address()
  );

  const senderAuth = await client.signMultiTransaction(x, feePayerTxn);
  const feePayerAuth = await client.signMultiTransaction(z, feePayerTxn);
  const txn = await client.submitFeePayerTransaction(
    feePayerTxn,
    senderAuth,
    feePayerAuth
  );
  const response = await client.waitForTransactionWithResult(txn.hash, {
    checkSuccess: true,
  });
  console.log("TxnReceipt", response);
  console.log(`X balance: ${await getBalance(x)} octas`);
  console.log(`Y balance: ${await getBalance(y)} octas`);
  console.log(`Z balance: ${await getBalance(z)} octas`);
})();
