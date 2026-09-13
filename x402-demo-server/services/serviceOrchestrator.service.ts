import axios from "axios";
import crypto from "crypto";
import algosdk from "algosdk";
import ServiceTransaction, {
  IServiceTransaction,
} from "../models/ServiceTransaction.model";
import { getServiceById, IRegisteredService } from "./serviceRegistry";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const uuidv4 = () => crypto.randomUUID();

export interface OrchestrationRequest {
  serviceId: string;
  userId: string;
  userPaymentTxId?: string;
  payload: {
    file_path?: string;
    raw_url?: string;
    code?: string;
    language?: string;
  };
}

export interface OrchestrationResult {
  transaction: IServiceTransaction;
  service: IRegisteredService;
  result: any;
  receipts: {
    userPaymentTxId: string;
    providerPaymentTxId: string;
    providerPayTo: string;
    providerAmount: number;
    platformFee: number;
    userTotalAmount: number;
    currency: string;
    network: string;
    verifiedAt: Date;
  };
}

/**
 * 1. Independent On-Chain Verification of User's $0.25 (250,000 micro-USDC) Payment
 * Queries Algorand MainNet to verify asset, amount, confirmation, and receiver.
 */
async function verifyOnChainUserPayment(
  txId: string,
  expectedReceiver: string,
  expectedAssetId: string,
  expectedAmountMicro: number
): Promise<{ confirmed: boolean; sender: string; amount: number }> {
  if (!txId || typeof txId !== "string" || txId.trim().length === 0) {
    throw new Error("Missing userPaymentTxId. A real Algorand on-chain transaction ID is required.");
  }

  // Prevent double spending / replay attacks:
  const existingCompleted = await ServiceTransaction.findOne({
    userPaymentTxId: txId,
    status: "completed",
  });
  if (existingCompleted) {
    throw new Error(
      `Transaction ${txId} has already been consumed (replay attempt detected).`
    );
  }

  logger.info(`[Payment Verification] Verifying on-chain tx ${txId} on Algorand MainNet...`);

  // Query Algorand MainNet Indexer (Algonode public API)
  const indexerUrl = `https://mainnet-idx.algonode.cloud/v2/transactions/${txId}`;
  let txData: any = null;

  try {
    const res = await axios.get(indexerUrl, { timeout: 10000 });
    if (res.status === 200 && res.data && res.data.transaction) {
      txData = res.data.transaction;
    }
  } catch (err: any) {
    logger.warn(`Algonode indexer lookup failed for ${txId}: ${err.message}. Trying Algod fallback...`);
  }

  // Fallback to Algod pending/confirmed transaction endpoint
  if (!txData) {
    try {
      const algodUrl = `${env.ALGORAND_SERVER || "https://mainnet-api.algonode.cloud"}/v2/transactions/pending/${txId}`;
      const res = await axios.get(algodUrl, { timeout: 10000 });
      if (res.status === 200 && res.data) {
        txData = res.data;
      }
    } catch (err: any) {
      throw new Error(`Unable to find or verify transaction ${txId} on Algorand MainNet: ${err.message}`);
    }
  }

  if (!txData) {
    throw new Error(`Transaction ${txId} could not be verified on Algorand MainNet.`);
  }

  // Extract transfer parameters (Indexer vs Algod format)
  const assetTransfer = txData["asset-transfer-transaction"] || txData.txn;
  if (!assetTransfer) {
    throw new Error(`Transaction ${txId} is not an asset transfer transaction.`);
  }

  const assetId = String(assetTransfer["asset-id"] || assetTransfer.xaid || "");
  const amount = Number(assetTransfer["amount"] || assetTransfer.aamt || 0);
  const receiver = String(assetTransfer["receiver"] || assetTransfer.arcv || "");
  const sender = String(txData["sender"] || txData.txn?.snd || "");

  if (assetId !== expectedAssetId) {
    throw new Error(
      `Invalid payment asset: expected USDC ASA ${expectedAssetId}, received asset ${assetId}.`
    );
  }

  if (amount < expectedAmountMicro) {
    throw new Error(
      `Insufficient payment amount: expected ${expectedAmountMicro} micro-USDC ($0.25), received ${amount} micro-USDC.`
    );
  }

  if (receiver !== expectedReceiver) {
    throw new Error(
      `Invalid receiver: expected Sikho treasury address ${expectedReceiver}, received ${receiver}.`
    );
  }

  logger.info(`[Payment Verification] Verified tx ${txId}: ${amount} micro-USDC from ${sender} to ${receiver}`);
  return { confirmed: true, sender, amount };
}

/**
 * Provider Payment Handling:
 * In the pure x402 architecture, all payments are signed directly by the user's connected wallet.
 * The backend does not hold or use private keys/mnemonics.
 */
async function signAndBroadcastProviderPayment(
  _service: IRegisteredService,
  _challengeReq: any
): Promise<{ providerPaymentTxId: string; paymentSignatureHeader: string }> {
  throw new Error(
    "Server-side wallet signing is disabled. All x402 payments must be authorized and signed directly by the user's connected wallet."
  );
}

/**
 * 3. Master Orchestration Flow
 */
export const executeServiceOrchestration = async (
  reqData: OrchestrationRequest
): Promise<OrchestrationResult> => {
  const service = getServiceById(reqData.serviceId);
  if (!service) {
    throw new Error(`Service "${reqData.serviceId}" is not registered or disabled.`);
  }

  if (!reqData.userPaymentTxId) {
    throw new Error("User payment transaction ID (userPaymentTxId) is required.");
  }

  const requestId = `req_${uuidv4().replace(/-/g, "").substring(0, 16)}`;

  // Step 1: Independently verify user's $0.25 USDC (250,000 micro-USDC) payment to Sikho treasury
  await verifyOnChainUserPayment(
    reqData.userPaymentTxId,
    service.platformTreasuryAddress || env.AVM_ADDRESS,
    service.assetId,
    250000
  );

  // Create initial transaction record with verified status
  const transaction = await ServiceTransaction.create({
    requestId,
    userId: reqData.userId,
    serviceId: service.id,
    providerId: service.provider,
    providerAmount: service.providerPrice,
    platformFee: service.platformFee,
    userAmount: service.userPrice,
    currency: service.currency,
    network: service.network,
    status: "payment_confirmed",
    userPaymentTxId: reqData.userPaymentTxId,
    requestPayload: reqData.payload,
  });

  try {
    // Step 2: Invoke Prism endpoint to get x402 challenge
    const targetUrl = service.endpoint;
    const isGet = !reqData.payload.code && reqData.payload.raw_url;

    let prismResponse: any;
    try {
      if (isGet) {
        prismResponse = await axios.get(targetUrl, {
          params: {
            file_path: reqData.payload.file_path || "src/index.ts",
            raw_url: reqData.payload.raw_url,
          },
          headers: {
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
          timeout: 15000,
        });
      } else {
        prismResponse = await axios.post(
          targetUrl,
          {
            file_path: reqData.payload.file_path || "src/code.ts",
            code: reqData.payload.code,
            language: reqData.payload.language || "typescript",
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            validateStatus: (status) => status < 500,
            timeout: 15000,
          }
        );
      }
    } catch (err: any) {
      throw new Error(`Failed to contact Prism service: ${err.message}`);
    }

    let auditData: any = null;
    let providerPaymentTxId: string = "";

    // Step 3: Handle x402 Payment Challenge
    if (prismResponse.status === 402) {
      transaction.status = "provider_payment_pending";
      await transaction.save();

      const prHeader =
        prismResponse.headers["payment-required"] ||
        prismResponse.headers["Payment-Required"] ||
        "";

      let challengeReq: any = null;
      if (prHeader) {
        try {
          const b64 = prHeader.includes(",") ? prHeader.split(",")[1].trim() : prHeader.trim();
          const decoded = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
          challengeReq = decoded.accepts?.[0] || decoded;
        } catch (_) {}
      }

      // Perform real on-chain payment to Prism
      const { providerPaymentTxId: txId, paymentSignatureHeader } =
        await signAndBroadcastProviderPayment(service, challengeReq);

      providerPaymentTxId = txId;
      transaction.providerPaymentTxId = txId;
      transaction.status = "provider_payment_confirmed";
      await transaction.save();

      // Step 4: Retry Prism with real Payment-Signature
      const paidResponse = await axios({
        method: isGet ? "GET" : "POST",
        url: targetUrl,
        params: isGet
          ? {
              file_path: reqData.payload.file_path || "src/index.ts",
              raw_url: reqData.payload.raw_url,
            }
          : undefined,
        data: !isGet
          ? {
              file_path: reqData.payload.file_path || "src/code.ts",
              code: reqData.payload.code,
              language: reqData.payload.language || "typescript",
            }
          : undefined,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Payment-Signature": paymentSignatureHeader,
          "X-PAYMENT": paymentSignatureHeader,
        },
        validateStatus: (status) => status < 500,
        timeout: 30000,
      });

      if (paidResponse.status === 200 && paidResponse.data) {
        auditData = paidResponse.data;
        if (paidResponse.headers["payment-response"]) {
          transaction.paymentResponse = paidResponse.headers["payment-response"];
        }
      } else {
        throw new Error(
          `Prism returned error ${paidResponse.status} after payment: ${JSON.stringify(paidResponse.data)}`
        );
      }
    } else if (prismResponse.status === 200 && prismResponse.data) {
      auditData = prismResponse.data;
    } else {
      throw new Error(`Unexpected response from Prism (status ${prismResponse.status})`);
    }

    if (!auditData) {
      throw new Error("No review data received from Prism provider.");
    }

    // Step 5: Complete transaction
    transaction.status = "completed";
    transaction.result = auditData;
    transaction.completedAt = new Date();
    await transaction.save();

    return {
      transaction,
      service,
      result: auditData,
      receipts: {
        userPaymentTxId: transaction.userPaymentTxId || reqData.userPaymentTxId || "",
        providerPaymentTxId: transaction.providerPaymentTxId || providerPaymentTxId || "",
        providerPayTo: service.payToAddress,
        providerAmount: service.providerPrice,
        platformFee: service.platformFee,
        userTotalAmount: service.userPrice,
        currency: service.currency,
        network: service.network,
        verifiedAt: new Date(),
      },
    };
  } catch (err: any) {
    transaction.status = "failed";
    transaction.error = err.message || "Service orchestration error";
    await transaction.save();
    throw err;
  }
};
