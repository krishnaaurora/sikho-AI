import { x402Client, wrapFetchWithPayment } from '@x402-avm/fetch'
import { ALGORAND_MAINNET_CAIP2, createAlgodClient } from '@x402-avm/avm'
import type { ClientAvmSigner } from '@x402-avm/avm'
import { ExactAvmScheme } from '@x402-avm/avm/exact/client'

export const ALGORAND_TESTNET_CAIP2 = 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI='

export async function createX402Fetch(walletSigner: any) {
  console.log('createX402Fetch: initializing for address', walletSigner.address)
  const client = new x402Client()

  // Helper to create configured algod client with min fee enforcement
  const createConfiguredAlgodClient = (network: `${string}:${string}`, server: string) => {
    const algod = createAlgodClient(network, server)
    const originalSuggestedParams = algod.suggestedParams.bind(algod)
    algod.suggestedParams = async () => {
      const params = await originalSuggestedParams()
      const minFee = params.minFee ? BigInt(params.minFee) : 1000n
      params.fee = minFee
      return params
    }
    return algod
  }

  const mainnetAlgod = createConfiguredAlgodClient(
    ALGORAND_MAINNET_CAIP2,
    import.meta.env.VITE_MAINNET_ALGOD_SERVER || 'https://mainnet-api.algonode.cloud'
  )
  const testnetAlgod = createConfiguredAlgodClient(
    ALGORAND_TESTNET_CAIP2,
    import.meta.env.VITE_TESTNET_ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
  )

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

  // Register BOTH MainNet and TestNet so client seamlessly handles either network
  client.register(ALGORAND_MAINNET_CAIP2, new ExactAvmScheme(x402Signer, { algodClient: mainnetAlgod }))
  client.register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme(x402Signer, { algodClient: testnetAlgod }))
  console.log('x402 client registered for both MainNet and TestNet')

  // Custom fetch interceptor to strip illegal response-only header "Access-Control-Expose-Headers"
  // injected into outgoing Request objects by @x402-avm/fetch
  const cleanFetch: typeof fetch = async (input, init) => {
    let reqInput = input;
    let reqInit = init;

    if (input instanceof Request) {
      const cleanHeaders = new Headers(input.headers);
      cleanHeaders.delete('access-control-expose-headers');
      cleanHeaders.delete('Access-Control-Expose-Headers');
      reqInput = new Request(input, { headers: cleanHeaders });
    } else if (reqInit && reqInit.headers) {
      if (reqInit.headers instanceof Headers) {
        reqInit.headers.delete('access-control-expose-headers');
        reqInit.headers.delete('Access-Control-Expose-Headers');
      } else if (Array.isArray(reqInit.headers)) {
        reqInit.headers = reqInit.headers.filter(
          ([k]) => k.toLowerCase() !== 'access-control-expose-headers'
        );
      } else if (typeof reqInit.headers === 'object') {
        const h = { ...reqInit.headers } as Record<string, any>;
        delete h['access-control-expose-headers'];
        delete h['Access-Control-Expose-Headers'];
        reqInit = { ...reqInit, headers: h };
      }
    }

    return fetch(reqInput, reqInit);
  };

  return wrapFetchWithPayment(cleanFetch, client);
}


