import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useAnchorProgram } from "./api/hook_call/anchorClient";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  
     useEffect(()=>{
         if(window !==undefined){
           let value = localStorage.getItem("ObjectValue");
             if(!value){
              localStorage.setItem("ObjectValue",initialTokens());
             }
         }
     },[])
  return <Component {...pageProps} />;
}

function initialTokens(){
    const TokenMap = new Map();
        TokenMap.set("solana",{
                balance:20,
                 program_id:'',
                  icon:"/icon/solana.png",
                   unitindollar:400,
                    symbol:"SOL",
                    address:null,
        });
         TokenMap.set("usdc",{
             balance:100,
              program_id:'',
               icon:"/icon/usdc.png",
                unitindollar:100,
                symbol:"USDC",
                address:""
         });
         return JSON.stringify(Object.fromEntries(TokenMap));  

}
