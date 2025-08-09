import { useAnchorProgram } from "./anchorClient";
import { BN, web3 } from "@coral-xyz/anchor";

export const SwapButton = () => {
  const { program, wallet } = useAnchorProgram();
 
  const handleSwap = async (amount:number,in_amount_out:number) => {
    if (!wallet.publicKey) {
      alert("Please connect wallet");
      return;
    }
     let infomation = localStorage.getItem("swapInfo");
           if(infomation) infomation = JSON.parse(infomation);
    try {
      await program.methods
        .validateAndSwap(new BN(amount), new BN(in_amount_out))
        .accounts({
          user: wallet.publicKey,
          userSource: new web3.PublicKey(information.userSource),
          userDestination: new web3.PublicKey(information.userDestination),
          tokenMint: new web3.PublicKey(information.tokenMint),
          proxyTokenAccount: new web3.PublicKey(information.proxyTokenAccount),
          proxyMint: new web3.PublicKey(information.proxyMint),
          poolSource: new web3.PublicKey(information.poolSource),
          poolDestination: new web3.PublicKey(information.poolDestination),
          raydiumProgram: new web3.PublicKey(information.raydiumProgram),
          hookProgram: new web3.PublicKey(information.hookProgram),
          whitelist: new web3.PublicKey(information.whitelist),
          tokenProgram: web3.TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Swap successful!");
    } catch (err) {
      console.error("Swap failed:", err);
    }
  };

  return <button onClick={handleSwap}>Swap Now</button>;
};
