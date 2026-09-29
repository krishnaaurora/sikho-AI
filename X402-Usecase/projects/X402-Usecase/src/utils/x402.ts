import { x402Client, wrapFetchWithPayment } from '@x402-avm/fetch'
import { ALGORAND_MAINNET_CAIP2, createAlgodClient } from '@x402-avm/avm'
import type { ClientAvmSigner } from '@x402-avm/avm'
import { ExactAvmScheme } from '@x402-avm/avm/exact/client'

export async function createX402Fetch(walletSigner: any) {
  console.log('createX402Fetch: initializing for address', walletSigner.address)
  const client = new x402Client()

  // Create algod client for MainNet and intercept suggestedParams to enforce min fee
  const algodClient = createAlgodClient(ALGORAND_MAINNET_CAIP2, 'https://mainnet-api.algonode.cloud')
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

  client.register(ALGORAND_MAINNET_CAIP2, new ExactAvmScheme(x402Signer, { algodClient }))
  console.log('x402 client registered for MainNet')

  // Custom fetch interceptor to strip illegal response-only header "Access-Control-Expose-Headers"
  // injected into outgoing Request objects by @x402-avm/fetch
  const cleanFetch: typeof fetch = async (input, init) => {
    if (input instanceof Request) {
      try {
        input.headers.delete('access-control-expose-headers');
        input.headers.delete('Access-Control-Expose-Headers');
      } catch {
        // Headers might be immutable on some browser implementations
      }
      return fetch(input);
    }

    if (init && init.headers) {
      if (init.headers instanceof Headers) {
        init.headers.delete('access-control-expose-headers');
        init.headers.delete('Access-Control-Expose-Headers');
      } else if (Array.isArray(init.headers)) {
        init.headers = init.headers.filter(
          ([k]) => k.toLowerCase() !== 'access-control-expose-headers'
        );
      } else if (typeof init.headers === 'object') {
        const h = { ...init.headers } as Record<string, any>;
        delete h['access-control-expose-headers'];
        delete h['Access-Control-Expose-Headers'];
        init.headers = h;
      }
    }

    return fetch(input, init);
  };

  return wrapFetchWithPayment(cleanFetch, client);
}


