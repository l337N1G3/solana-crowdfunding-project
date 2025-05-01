import './App.css';

import {
  useEffect,
  useState,
} from 'react';

import { Buffer } from 'buffer';

import {
  AnchorProvider,
  Program,
  utils,
  web3,
} from '@coral-xyz/anchor';
import {
  clusterApiUrl,
  Connection,
  PublicKey,
} from '@solana/web3.js';

import idl from './idl.json';

console.log("Loaded IDL:", idl);

window.Buffer = Buffer;

// Make sure idl.metadata.address is defined in your IDL JSON
const programID = new PublicKey(idl.address);
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};

const { SystemProgram } = web3;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    // Pass the entire opts object here, not opts.proflightCommitment
    const provider = new AnchorProvider(connection, window.solana, opts);
    return provider;
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log("Connected with public key", response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana wallet not found!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log("Connected with PublicKey:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString()); // important to set state
    }
  };
  const provider = getProvider();
  const program = new Program(idl, programID, provider);
  console.log(program.methods, program.rpc);
  

  const createCampaign = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      const [campaign] = await PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
          provider.wallet.publicKey.toBuffer(),
        ],
        program.programId
      );
  
      await program.methods
        .create("campaign name", "campaign description")
        .accounts({
          campaign,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
  
      console.log("Created a new campaign w/ address:", campaign.toString());
    } catch (error) {
      console.error("Error creating campaign account:", error);
    }
  };
  const renderNotConnectedContainer = () => {
    return (
      <button onClick={connectWallet}>Connect to Wallet</button>
    );
  };

  const renderConnectedContainer = () => {
    return (
      <button onClick={createCampaign}>Create a campaign</button>
    );
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <div className="App">
      {!walletAddress && renderNotConnectedContainer()}
      {walletAddress && renderConnectedContainer()}
    </div>
  );
};

export default App;
