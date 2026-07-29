import { x402Client, wrapFetchWithPayment } from '@x402-avm/fetch'
import { ALGORAND_TESTNET_CAIP2, createAlgodClient } from '@x402-avm/avm'
import type { ClientAvmSigner } from '@x402-avm/avm'
import { ExactAvmScheme } from '@x402-avm/avm/exact/client'

export async function createX402Fetch(walletSigner: any) {
  console.log('createX402Fetch: initializing for address', walletSigner.address)
  const client = new x402Client()

  // Create algod client for TestNet and intercept suggestedParams to enforce min fee
  const algodClient = createAlgodClient(ALGORAND_TESTNET_CAIP2, 'https://testnet-api.algonode.cloud')
  const originalSuggestedParams = algodClient.suggestedParams.bind(algodClient)
  algodClient.suggestedParams = async () => {
    const params = await originalSuggestedParams()
    // Enforce fee to be minFee (typically 1000 microAlgos / 1mA)
    const minFee = params.minFee ? BigInt(params.minFee) : 1000n
    params.fee = minFee
    return params
  }

  let originalTxns: Uint8Array[] = []

  const x402Signer: ClientAvmSigner = {
    address: walletSigner.address,
    signTransactions: async (txns: Uint8Array[]) => {
      try {
        console.log('x402Signer.signTransactions: received', txns.length, 'transaction(s)')
        originalTxns = txns
        
        txns.forEach((txn, i) => {
          console.log(`Txn ${i}: ${txn.byteLength} bytes, first 10 bytes:`, Array.from(txn.slice(0, 10)))
        })

        console.log('Calling wallet.signTransactions...')
        const walletResult = await walletSigner.signTransactions(txns)
        
        console.log('Wallet returned:', typeof walletResult)
        console.log('Is array?', Array.isArray(walletResult))
        console.log('Array length:', Array.isArray(walletResult) ? walletResult.length : 'N/A')
        
        if (Array.isArray(walletResult)) {
          walletResult.forEach((item, i) => {
            console.log(`Item ${i}: type=${typeof item}, is null=${item === null}, is Uint8Array=${item instanceof Uint8Array}`)
          })
          
          const result = walletResult.map((item: any, i: number) => {
            if (item === null || item === undefined) {
              console.log(`Item ${i}: unsigned, using original unsigned transaction (${originalTxns[i]?.byteLength} bytes)`)
              return originalTxns[i]
            }
            if (item instanceof Uint8Array) {
              console.log(`Item ${i}: signed (${item.byteLength} bytes)`)
              return item
            }
            if (typeof item === 'string') {
              console.log(`Item ${i}: base64 string`)
              const binaryString = atob(item)
              const bytes = new Uint8Array(binaryString.length)
              for (let j = 0; j < binaryString.length; j++) {
                bytes[j] = binaryString.charCodeAt(j)
              }
              return bytes
            }
            console.log(`Item ${i}: unknown format, using original`)
            return originalTxns[i]
          })
          
          console.log('Returning', result.length, 'transactions')
          return result
        }
        
        return walletResult
      } catch (error) {
        console.error('signTransactions error:', error)
        throw error
      }
    },
  }

  client.register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme(x402Signer, { algodClient }))
  console.log('x402 client registered for TestNet')

  return wrapFetchWithPayment(fetch, client)
}

