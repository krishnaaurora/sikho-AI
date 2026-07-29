import React from 'react'
import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'
import { X, Wallet as WalletIcon } from 'lucide-react'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  if (!openModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={closeModal}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <WalletIcon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">
              Connect Algorand Wallet
            </h3>
          </div>
          <button 
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeAddress && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <Account />
            </div>
          )}

          <div className="space-y-3">
            {!activeAddress ? (
              wallets?.map((wallet) => (
                <button
                  data-test-id={`${wallet.id}-connect`}
                  className="w-full flex items-center gap-4 px-4 py-3.5 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary/50 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-xl transition-all duration-200 font-semibold text-left shadow-sm group"
                  key={`provider-${wallet.id}`}
                  onClick={async () => {
                    await wallet.connect()
                    closeModal()
                  }}
                >
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-1 group-hover:scale-105 transition-transform">
                    {isKmd(wallet) ? (
                      <WalletIcon className="h-6 w-6 text-primary" />
                    ) : (
                      <img
                        alt={`wallet_icon_${wallet.id}`}
                        src={wallet.metadata.icon}
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900 dark:text-white text-base">
                      {isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                      Connect via {isKmd(wallet) ? 'KMD provider' : wallet.metadata.name}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                You are currently connected.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
          <button
            data-test-id="close-wallet-modal"
            className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-150 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all"
            onClick={closeModal}
          >
            Close
          </button>
          
          {activeAddress && (
            <button
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-red-500/10"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                  closeModal()
                }
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectWallet
