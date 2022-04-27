import "../styles/globals.css";
import { Web3ContextProvider } from "../context/web3Context";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3ContextProvider>
      <Component {...pageProps} />
    </Web3ContextProvider>
  );
}

export default MyApp;
