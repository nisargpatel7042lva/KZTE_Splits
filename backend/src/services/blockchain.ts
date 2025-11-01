import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from '@solana/web3.js'
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  getMint,
} from '@solana/spl-token'
import CryptoJS from 'crypto-js'
import { config } from '../config'
import { WalletInfo, TransactionInfo } from '../types'

// Initialize Solana connection
const connection = new Connection(
  config.solana.rpcUrl,
  'confirmed'
)

/**
 * Create a new Solana wallet
 * Generates keypair and encrypts private key
 */
export function createWallet(): WalletInfo {
  const keypair = Keypair.generate()
  const publicKey = keypair.publicKey.toString()
  const privateKeyArray = Array.from(keypair.secretKey)
  const privateKeyString = JSON.stringify(privateKeyArray)

  // Encrypt private key
  const encryptedPrivateKey = CryptoJS.AES.encrypt(
    privateKeyString,
    config.solana.walletEncryptionKey
  ).toString()

  return {
    publicKey,
    encryptedPrivateKey,
  }
}

/**
 * Decrypt private key and return Keypair
 */
function decryptPrivateKey(encryptedPrivateKey: string): Keypair {
  try {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedPrivateKey,
      config.solana.walletEncryptionKey
    ).toString(CryptoJS.enc.Utf8)

    const privateKeyArray = JSON.parse(decrypted)
    const secretKey = Uint8Array.from(privateKeyArray)
    return Keypair.fromSecretKey(secretKey)
  } catch (error) {
    throw new Error('Failed to decrypt private key')
  }
}

/**
 * Get KZTE token balance for a wallet
 * @param walletAddress - Solana public key as string
 * @returns Balance in KZTE (converted from smallest unit)
 */
export async function getBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const tokenMintAddress = new PublicKey(config.solana.kzteTokenMint)

    // Get associated token account
    try {
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        Keypair.generate(), // Dummy keypair for read-only operation
        tokenMintAddress,
        publicKey,
        false // Don't create if doesn't exist
      )

      const accountInfo = await getAccount(connection, tokenAccount.address)
      const mint = await getMint(connection, tokenMintAddress)

      // Convert balance from smallest unit to KZTE
      const balance = Number(accountInfo.amount) / Math.pow(10, mint.decimals)
      return balance
    } catch (error: any) {
      // If token account doesn't exist, balance is 0
      if (error.message?.includes('could not find')) {
        return 0
      }
      throw error
    }
  } catch (error) {
    console.error('Error getting balance:', error)
    throw new Error('Failed to fetch wallet balance')
  }
}

/**
 * Transfer KZTE tokens from one wallet to another
 * @param fromEncryptedKey - Encrypted private key of sender
 * @param toWalletAddress - Recipient's public key
 * @param amount - Amount in KZTE
 * @returns Transaction signature
 */
export async function transferKZTE(
  fromEncryptedKey: string,
  toWalletAddress: string,
  amount: number
): Promise<TransactionInfo> {
  try {
    // Decrypt sender's keypair
    const fromKeypair = decryptPrivateKey(fromEncryptedKey)
    const toPublicKey = new PublicKey(toWalletAddress)
    const tokenMintAddress = new PublicKey(config.solana.kzteTokenMint)

    // Get mint info to calculate amount in smallest unit
    const mint = await getMint(connection, tokenMintAddress)
    const amountInSmallestUnit = BigInt(
      Math.floor(amount * Math.pow(10, mint.decimals))
    )

    // Get or create associated token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      tokenMintAddress,
      fromKeypair.publicKey
    )

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair, // Payer for account creation if needed
      tokenMintAddress,
      toPublicKey
    )

    // Create transfer instruction
    const signature = await transfer(
      connection,
      fromKeypair, // Payer
      fromTokenAccount.address, // Source
      toTokenAccount.address, // Destination
      fromKeypair.publicKey, // Owner
      amountInSmallestUnit
    )

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed')

    return {
      signature,
      status: 'confirmed',
      amount,
      from: fromKeypair.publicKey.toString(),
      to: toWalletAddress,
    }
  } catch (error) {
    console.error('Error transferring KZTE:', error)
    throw new Error('Failed to transfer KZTE tokens')
  }
}

/**
 * Get transaction history for a wallet
 * @param walletAddress - Solana public key
 * @param limit - Number of transactions to fetch
 */
export async function getTransactionHistory(
  walletAddress: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const publicKey = new PublicKey(walletAddress)

    // Fetch signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
    })

    // Fetch transaction details
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })
        return {
          signature: sig.signature,
          blockTime: sig.blockTime,
          status: sig.err ? 'failed' : 'confirmed',
          slot: sig.slot,
        }
      })
    )

    return transactions
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return []
  }
}

/**
 * Check transaction confirmation status
 * @param signature - Transaction signature
 */
export async function confirmTransaction(
  signature: string
): Promise<'confirmed' | 'pending' | 'failed'> {
  try {
    const status = await connection.getSignatureStatus(signature)

    if (!status || !status.value) {
      return 'pending'
    }

    if (status.value.err) {
      return 'failed'
    }

    if (
      status.value.confirmationStatus === 'confirmed' ||
      status.value.confirmationStatus === 'finalized'
    ) {
      return 'confirmed'
    }

    return 'pending'
  } catch (error) {
    console.error('Error checking transaction status:', error)
    return 'failed'
  }
}

/**
 * Create associated token account for a wallet (if doesn't exist)
 * Required before receiving KZTE tokens
 */
export async function createTokenAccount(
  ownerEncryptedKey: string
): Promise<string> {
  try {
    const ownerKeypair = decryptPrivateKey(ownerEncryptedKey)
    const tokenMintAddress = new PublicKey(config.solana.kzteTokenMint)

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      ownerKeypair,
      tokenMintAddress,
      ownerKeypair.publicKey
    )

    return tokenAccount.address.toString()
  } catch (error) {
    console.error('Error creating token account:', error)
    throw new Error('Failed to create token account')
  }
}
