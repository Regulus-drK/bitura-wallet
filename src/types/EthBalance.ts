import BigNumber from "bignumber.js"; // Uso de BigNumber para evitar errores de cálculo (los números pueden ser demasiado grandes)

export interface EthBalance {
  status: string;
  message: string;
  result: string; // balance en Wei (string grande)
}

export interface EthTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string; // valor en Wei (string)
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
}

export interface EthResponse {
  address: string;
  balance: EthBalance;
  transactions: {
    status: string;
    message: string;
    result: EthTx[];
  };
  page: number;
}

export interface ParsedEthTx extends EthTx {
  feeWei: BigNumber;  // gasUsed * gasPrice en Wei
  feeEth: BigNumber;  // fee convertido a ETH
  valueEth: BigNumber;
}

export interface ParsedEthResponse {
  address: string;
  balanceWei: BigNumber;      // Wei (BigNumber)
  balanceEth: BigNumber;      // ETH
  transactions: ParsedEthTx[];
  page: number;
}

// Método para convertir (parsear) los parámetros a número que se puedan usar
export function parseEthResponse(response: EthResponse): ParsedEthResponse {
  const WEI_IN_ETH = new BigNumber(1e18);

  const balanceWei = new BigNumber(response.balance.result);
  const balanceEth = balanceWei.dividedBy(WEI_IN_ETH);

  const transactions: ParsedEthTx[] = (response.transactions?.result ?? []).map(tx => {
    const gasUsed = new BigNumber(tx.gasUsed);
    const gasPrice = new BigNumber(tx.gasPrice);
    // Añadir el value calculado de la Tx
    const feeWei = gasUsed.multipliedBy(gasPrice);
    // Value de Tx en Wei para convertir después
    const valueWei = new BigNumber(tx.value);
    return {
      ...tx,
      feeWei,
      feeEth: feeWei.dividedBy(WEI_IN_ETH),
      valueEth: valueWei.dividedBy(WEI_IN_ETH),  // Por último, conversión del "value" en Wei de la Tx a Ether
    };
  });

  return {
    address: response.address,
    balanceWei,
    balanceEth,
    transactions,
    page: response.page,
  };
}
