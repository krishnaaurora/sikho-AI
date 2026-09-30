import algosdk from "algosdk";
import dotenv from "dotenv";

dotenv.config();

const TESTNET_ALGOD_SERVER = process.env.ALGORAND_SERVER || "https://testnet-api.algonode.cloud";
const TESTNET_USDC_ASA = 10458941;

export async function validateTestnetWallet(addressToTest?: string) {
  const address = (addressToTest || process.env.X402_PAY_TO || process.env.AVM_ADDRESS || "").trim();

  console.log("==================================================");
  console.log("ALGORAND TESTNET WALLET VALIDATION FOR SIKHO AI");
  console.log("==================================================");
  console.log(`Target Address: ${address}`);
  console.log(`Network: Algorand Testnet`);
  console.log(`USDC ASA ID: ${TESTNET_USDC_ASA}`);
  console.log(`Algod Node: ${TESTNET_ALGOD_SERVER}\n`);

  if (!address) {
    console.error("❌ ERROR: No wallet address provided. Specify an address or set X402_PAY_TO.");
    return { success: false, reason: "No address provided" };
  }

  // 1. Syntax check
  if (!algosdk.isValidAddress(address)) {
    console.error("❌ FAILED: Address syntax is invalid. Must be a valid 58-character Algorand address.");
    return { success: false, reason: "Invalid Algorand address syntax" };
  }
  console.log("✅ Check 1: Address syntax is valid.");

  // 2. Mainnet collision check - ensure user is not reusing Mainnet payTo
  const mainnetPayTo = "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY";
  if (address === mainnetPayTo) {
    console.warn("⚠️ WARNING: This address matches the existing Sikho Mainnet payTo.");
    console.warn("   Prompt requirement: The Testnet payTo MUST be a separate Testnet account.");
  } else {
    console.log("✅ Check 2: Separate from Sikho Mainnet payTo.");
  }

  // 3. Query Algorand Testnet
  const client = new algosdk.Algodv2("", TESTNET_ALGOD_SERVER, "");
  let acctInfo: any;
  try {
    acctInfo = await client.accountInformation(address).do();
  } catch (err: any) {
    if (err?.status === 404 || err?.response?.statusCode === 404 || (err?.message && err.message.includes("404"))) {
      console.error("❌ FAILED: Account does not exist on Algorand Testnet yet.");
      console.error("   To activate: Fund this address with Testnet ALGO from https://bank.testnet.algorand.network or https://lora.algokit.io/testnet/fund");
      return { success: false, reason: "Account not found on Testnet" };
    }
    console.error(`❌ FAILED: Could not query Algod node: ${err.message}`);
    return { success: false, reason: err.message };
  }

  console.log("✅ Check 3: Account exists on Algorand Testnet.");

  // 4. Check ALGO balance
  const microAlgos = Number(acctInfo.amount || 0);
  const algoBalance = microAlgos / 1_000_000;
  const minBalance = Number(acctInfo["min-balance"] || 100_000) / 1_000_000;
  console.log(`   ALGO Balance: ${algoBalance.toFixed(4)} ALGO (Min required: ${minBalance.toFixed(4)} ALGO)`);

  if (algoBalance < minBalance + 0.002) {
    console.error("❌ FAILED: Insufficient ALGO balance to cover minimum balance requirement and fees.");
    console.error("   Fund with Testnet ALGO: https://bank.testnet.algorand.network");
    return { success: false, reason: "Insufficient ALGO balance" };
  }
  console.log("✅ Check 4: Account has sufficient Testnet ALGO for fees.");

  // 5. Check Testnet USDC ASA Opt-in
  const assets: any[] = acctInfo.assets || [];
  const usdcAsset = assets.find((a: any) => {
    const rawId = a.assetId !== undefined ? a.assetId : a["asset-id"];
    return Number(rawId) === TESTNET_USDC_ASA;
  });

  if (!usdcAsset) {
    console.error(`❌ FAILED: Account is NOT opted into Testnet USDC (ASA ID: ${TESTNET_USDC_ASA}).`);
    console.error("   An account must opt into ASA 10458941 before it can receive Testnet USDC.");
    console.error("   Opt-in can be performed via Pera/Defly wallet or algosdk 0-amount asset transfer transaction to self.");
    return { success: false, reason: `Not opted into ASA ${TESTNET_USDC_ASA}` };
  }

  const usdcBalance = Number(usdcAsset.amount || 0) / 1_000_000;
  console.log(`✅ Check 5: Account is opted into Testnet USDC (ASA ${TESTNET_USDC_ASA}).`);
  console.log(`   Current Testnet USDC balance: $${usdcBalance.toFixed(2)} USDC`);

  console.log("\n==================================================");
  console.log("🎉 ALL TESTNET WALLET VALIDATION CHECKS PASSED!");
  console.log("==================================================");

  return {
    success: true,
    address,
    algoBalance,
    usdcBalance,
    optedIn: true,
  };
}

if (require.main === module) {
  const targetAddress = process.argv[2];
  validateTestnetWallet(targetAddress).catch(console.error);
}
