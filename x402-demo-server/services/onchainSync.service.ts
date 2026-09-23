import axios from "axios";
import mongoose from "mongoose";
import Payment, { PaymentStatus, PaymentMethod } from "../models/Payment.model";
import User, { UserRole } from "../models/User.model";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let lastSyncTimestamp = 0;
const SYNC_COOLDOWN_MS = 15000; // 15 seconds cooldown between external indexer requests

/**
 * Decode base64 note field from Algorand transaction
 */
function decodeNote(noteBase64?: string): string {
  if (!noteBase64) return "";
  try {
    return Buffer.from(noteBase64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/**
 * Infer human-readable feature description from amount or note
 */
function inferFeature(amount: number, note: string): string {
  if (note && note.length > 2) {
    if (note.includes("x402") || note.includes("sikho") || note.includes("resume") || note.includes("course")) {
      return note;
    }
  }
  if (amount === 0.05) return "Sikho Platform Fee (GitHub Review)";
  if (amount === 0.20) return "Prism Accurate Code Review";
  if (amount === 0.25) return "GitHub Code Review (Full Split)";
  if (amount === 0.30) return "Resume Intelligence / AI Explainer Pass";
  if (amount === 0.15) return "Interview Pro / Learning Path Unlock";
  if (amount >= 5.0) return "Full Course Access & Certification Pass";
  if (amount >= 1.0) return "Premium Chapter Unlock";
  return `x402 Pay-Per-Use ($${amount.toFixed(2)} USDC)`;
}

/**
 * Sync real-time Algorand on-chain transactions for configured merchant addresses
 */
export const syncOnchainTransactions = async (force: boolean = false) => {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < SYNC_COOLDOWN_MS) {
    return; // Within cooldown period
  }
  lastSyncTimestamp = now;

  const addressesToSync = [
    env.AVM_ADDRESS || "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
  ];

  try {
    // Find or fallback to a real learner user ID for referencing
    const defaultUser = await User.findOne({ role: UserRole.LEARNER, isDeleted: false });
    const defaultUserId = defaultUser?._id;

    for (const address of addressesToSync) {
      if (!address) continue;

      // 1. Fetch from Algorand Mainnet Indexer
      try {
        const response = await axios.get(
          `https://mainnet-idx.algonode.cloud/v2/accounts/${address}/transactions?limit=100`,
          { timeout: 8000 }
        );

        const transactions = response.data?.transactions || [];

        for (const tx of transactions) {
          let amount = 0;
          let currency = "USDC";
          let isIncoming = false;

          // Check Asset Transfer (e.g. USDC ASA 31566704 on Mainnet)
          if (tx["asset-transfer-transaction"]) {
            const axfer = tx["asset-transfer-transaction"];
            const assetId = axfer["asset-id"];
            const receiver = axfer.receiver;

            if (receiver === address && (assetId === 31566704 || assetId === 10458941)) {
              amount = axfer.amount / 1000000;
              currency = "USDC";
              isIncoming = true;
            }
          } 
          // Check standard ALGO payment
          else if (tx["payment-transaction"]) {
            const pay = tx["payment-transaction"];
            if (pay.receiver === address) {
              amount = pay.amount / 1000000;
              currency = "ALGO";
              isIncoming = true;
            }
          }

          if (isIncoming && amount > 0 && tx.id) {
            const txTime = new Date((tx["round-time"] || Math.floor(Date.now() / 1000)) * 1000);
            const noteText = decodeNote(tx.note);
            const featureName = inferFeature(amount, noteText);

            // Upsert directly into Payment model
            await Payment.findOneAndUpdate(
              { transactionHash: tx.id },
              {
                $set: {
                  amount,
                  currency,
                  blockchain: "Algorand",
                  paymentMethod: PaymentMethod.X402,
                  paymentStatus: PaymentStatus.COMPLETED,
                  paidAt: txTime,
                  createdAt: txTime,
                  updatedAt: txTime,
                  x402Reference: featureName,
                },
                $setOnInsert: {
                  userId: defaultUserId || new mongoose.Types.ObjectId(),
                  courseId: defaultUserId || new mongoose.Types.ObjectId(),
                },
              },
              { upsert: true, new: true }
            );
          }
        }
      } catch (mainnetErr: any) {
        logger.warn(`[OnchainSync] Mainnet indexer check warning: ${mainnetErr.message}`);
      }

      // 2. Fetch from Algorand Testnet Indexer (if test transactions exist)
      try {
        const testResponse = await axios.get(
          `https://testnet-idx.algonode.cloud/v2/accounts/${address}/transactions?limit=50`,
          { timeout: 8000 }
        );

        const testTxs = testResponse.data?.transactions || [];
        for (const tx of testTxs) {
          let amount = 0;
          let currency = "USDC";
          let isIncoming = false;

          if (tx["asset-transfer-transaction"]) {
            const axfer = tx["asset-transfer-transaction"];
            const assetId = axfer["asset-id"];
            if (axfer.receiver === address && (assetId === 10458941 || assetId === 31566704)) {
              amount = axfer.amount / 1000000;
              currency = "USDC";
              isIncoming = true;
            }
          }

          if (isIncoming && amount > 0 && tx.id) {
            const txTime = new Date((tx["round-time"] || Math.floor(Date.now() / 1000)) * 1000);
            const noteText = decodeNote(tx.note);
            const featureName = inferFeature(amount, noteText);

            await Payment.findOneAndUpdate(
              { transactionHash: tx.id },
              {
                $set: {
                  amount,
                  currency,
                  blockchain: "Algorand Testnet",
                  paymentMethod: PaymentMethod.X402,
                  paymentStatus: PaymentStatus.COMPLETED,
                  paidAt: txTime,
                  createdAt: txTime,
                  updatedAt: txTime,
                  x402Reference: featureName,
                },
                $setOnInsert: {
                  userId: defaultUserId || new mongoose.Types.ObjectId(),
                  courseId: defaultUserId || new mongoose.Types.ObjectId(),
                },
              },
              { upsert: true }
            );
          }
        }
      } catch (testnetErr: any) {
        // Ignore testnet errors quietly
      }
    }
  } catch (err: any) {
    logger.error(`[OnchainSync] Error during onchain sync: ${err.message}`);
  }
};
