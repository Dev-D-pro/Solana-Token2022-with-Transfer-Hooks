import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
 
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

