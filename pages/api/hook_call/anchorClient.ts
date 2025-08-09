
import { AnchorProvider, Program, web3, BN } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "./idl.json"; 
import { useWallet } from "@solana/wallet-adapter-react";

const programID = new web3.PublicKey("sftswap7031668278"); 
const network = web3.clusterApiUrl("devnet"); 
const opts = { preflightCommitment: "processed" as web3.Commitment };

export const useAnchorProgram = () => {
  const wallet = useWallet();
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new AnchorProvider(connection, wallet, opts);
  const program = new Program(idl as any, programID, provider);

  return { program, wallet, connection };
};
