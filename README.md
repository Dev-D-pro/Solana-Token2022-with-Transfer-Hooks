# SftSwap — AMM Middleware with Token-2022 Hook Support

## Program Deployment

| Environment | Program ID |
|-------------|------------|
| Devnet (middleware_relayer) | `je033sd668278adfadfaitujsd` | 
| Devnet (Kyc_hook Program)    | `ad48sdywoahblaueiwohgoahdiwy`|
---

## Short Description
SftSwap is a middleware relayer that enables **Token-2022** tokens with active **Transfer Hooks** to be tradable on legacy Solana AMMs (e.g. Raydium).  
The middleware validates hook programs before swaps, enforces a whitelist of safe hooks, and uses proxy wrapping/unwrapping to ensure compatibility with AMMs that do not natively support token hooks.

---

## Table of Contents
1. [Overview](#overview)
2. [How the System Works](#how-the-system-works-swap-flow)
3. [Core Smart Contracts Functions](#core-smart-contract-functions)
4. [Our KYC Program](#our-hyc-hook-program)
5. [Key Features](#key-features)
6. [Our Kyc Hook Implementation](#kyc_hook-full-implementation)
7. [Whats Implemented - Bounty Fullfilled](#whats-implemented---bounty-fulfilled)
8. [Our Demo Video](#our-short-demo-video)
9. [Middleware Idl](#our-middleware-idljson)
10. [Kyc Hook Idl](#our-kyc-hook-idljson)
11. [Contributors](#contributors)

---

## Overview
This repository implements:
- **Anchor (Rust) middleware program**
- **React + TypeScript frontend**

Together, they allow users to:
- Create Token-2022 mints with attached Transfer Hooks.
- Create LP pools (e.g., SOL <-> Token-2022).
- Execute swaps while preserving Transfer Hook logic.

The middleware performs:
- **Pre-transfer simulation** (dry-run) of the hook.
- **Whitelist check** for safe hook programs.
- **Proxy wrapping/unwrapping** for AMMs without Token-2022 hook support.

---
## Project Code Structure
 ## Our important pages structures
```plaintext
/.anchor-program
|    |--- kychook_program
|    |     |--- lib.rs
|    |     |--- idl.json
|    |--- middleware_program
|          |--- lib.rs
|          |--- idl.json
/pages
|   |--- /api
|   |     |--- /hook_call
|   |     |     |--- anchorClient.ts
|   |     |     |--- swapToken.ts
|   |     |     |--- idl.json
|   |     |--- /modal
|   |     |     |--- select.tsx
|   |     |--- /nav
|   |     |     |--- connectWallet.tsx
|   |     |     |--- createpool.tsx
|   |     |     |--- createtoken.tsx
|   |     |     |--- header.tsx
|   |     |     |--- swaptoken.tsx
|   |     |     |--- tabs.tsx
|   |     |     |--- tokenlist.tsx
|   |--- _app.tsx
|   |--- _document.tsx
|   |--- index.tsx
```

## How the System Works (Swap Flow)

1. Frontend requests a swap with:
   - `user`
   - `amount_in`
   - `min_amount_out`
   - `token_mint`
2. Middleware simulates the token’s Transfer Hook via a read-only CPI.
3. Middleware verifies the hook program is in the whitelist.
4. If simulation & whitelist pass:
   - **If AMM supports hooks** → direct CPI → AMM swap.
   - **If AMM does not support hooks**:
     1. **`proxy_wrap`**: Move Token-2022 into a proxy token account.
     2. **`invoke_amm_swap`**: Swap using proxy tokens.
     3. **`proxy_unwrap`**: Burn proxy tokens and restore Token-2022.

---

## Core Smart Contract Functions

### `create_token_with_hook Implementation`
Creates a Token-2022 mint with a hook, mints supply to the user, records hook in whitelist.
```rust
pub fn create_token_with_hook(
        ctx: Context<CreateTokenWithHook>, 
        decimals: u8,
        initial_supply: u64,
        hook_program: Pubkey,
    ) -> Result<()> {
        
        token_2022::initialize_mint2(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                InitializeMint2 {
                    mint: ctx.accounts.mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            decimals,
            &ctx.accounts.user.key(),
            Some(&hook_program),
        )?;

        
        token_2022::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            initial_supply,
        )?;

        
        let whitelist = &mut ctx.accounts.whitelist;
        if !whitelist.allowed_hooks.contains(&hook_program) {
            whitelist.allowed_hooks.push(hook_program);
        }

        Ok(())
    }
  ```
### `validate_and_swap`
- Simulates hook.
- Verifies whitelist.
- Swaps via AMM, with proxy wrap/unwrap if needed.
 ```rust
  pub fn validate_and_swap(ctx:Context<ValidateAndSwap>,amount_in:u64,min_amount_out:u64,) -> Result<()>{
             let hook_program = &ctx.accounts.hook_program;
            
             let hook_passed = simulate_hook(&hook_program.key(),&ctx.accounts.user.key(),amount_in)?;
             require!(hook_passed,CustomError:HookValidationFailed);

               
               let whitelist = &ctx.accounts.whitelist.load()?;
                require!(whitelist.hooks.contains(&hook_program.key()),CustomError:HookNotWhitelisted);

                //wrap token if AMM doesn't support hook
               
                    proxy_wrap(&ctx,amount_in)?;
                        invoke_amm_swap(&ctx,amount_in,min_amount_out)?;
                      proxy_unwrap(&ctx)?;
        }

```


### `simulate_hook`
Read-only CPI to our kyc_hook program to test if transfer will pass.
```rust
//let invoke our kyc hook PreTransferHookix at: ad48sdywoahblaueiwohgoahdiwy
#[derive(AnchorSerialize,AnchorDeserialize)]
pub struct PreTransferHookix{
    pub _amount:u64,
}
///simulate hook program logic (read-only)

fn simulate_hook(hook: &Pubkey, user:&Pubkey, amount:u64) -> Result<bool>{

    // our kyc_hook function
                let ix_data = PreTransferHookix{_amount:amount}.try_to_vec().unwrap();
    let ix = Instruction{
          program_id:*hook,
            accounts:vec![
              AccountMeta::new_readonly(*user,true),
          ],
          data:
          HookInstruction::ix,
    };
    let account_infos: Vec<AccountInfo> = vec![];
    let result = solana::program::invoke(&ix,&account_infos);
      match result {
          Ok(_) => Ok(true),
          Err(_) => Ok(false),
      }
}
```

### `invoke_amm_swap`

Calls AMM swap instruction; includes proxy unwrap/wrap around call.
 ```rust
fn invoke_amm_swap(ctx:&Context<ValidateAndSwap>,amount_in:u64,min_amount_out:u64) -> Result<()>{
     //step 1 proxy unwrap before trade
     proxy_unwrap(&ctx,amount_in)?;
   let ix = Instruction{
    program_id: ctx.accounts.raydium_program.key(),
     accounts: vec![
       AccountMeta::new(ctx.accounts.user_source.key(),false),
       AccountMeta::new(ctx.accounts.user_destination.key(),false),
       AccountMeta::new(ctx.accounts.pool_source.key(),false),
       AccountMeta::new(ctx.accounts.pool_destination.key(),false),
       AccountMeta::new_readonly(ctx.accounts.user.key(),true),
     ],
      data:
      RaydiumInstruction:Swap {
            amount_in,
              min_amount_out,
      }.try_to_vec().unwrap(),
   };
   let accout_infos  = vec![ctx.accounts.user_source.to_account_info(),ctx.accounts.user_destination.to_account_info(),ctx.accounts.pool_source.to_account_info(),ctx.accounts.pool_destination.to_account_info(),];
      invoke(&ix, &account_infos)?;
    
      proxy_wrap(&ctx,min_amount_out)?;
      
      Ok(());
}

```
### `proxy_wrap` / `proxy_unwrap`
- **Wrap**: Transfers Token-2022 into proxy token account.
- **Unwrap**: Burns proxy tokens, returns Token-2022.
```rust
fn proxy_wrap(ctx:&Context<ValidateAndSwap>,amount:u64) -> Result<()>{
      token::transfer(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
                 Transfer{
                    from:
                     ctx.accounts.user_source.to_account_info(),
                     to: ctx.accounts.proxy_token_account.to_account_info(),
                     authority: ctx.accounts.proxy_token_account.to_account_info(),
                 },
                ),
                amount,
    )
}

fn proxy_unwrap(ctx:&Context<ValidateAndSwap>,amount:u64) -> Result<()> {
    let user = &ctx.accounts.user;
    let user_source = &ctx.accounts.proxy_token_account;
    let proxy_mint = &ctx.accounts.proxy_mint;
    let token_program = &ctx.accounts.token_program;


    let burns_accounts = Burn{
         mint: proxy_mint.to_account_info(),
         from: user_source.to_account_info(),
          authority: user.to_account_info(),
    };
    let burn_ctx = CpiContext::new(token_program.to_account_info(),burns_accounts);   
        token_2022::burn(burn_ctx,amount)?;

      
        let transfer_accounts = Transfer{
             from:user_source.to_account_info(),
             to: ctx.accounts.user_source.to_account_info(),
             authority: user.to_account_info(),
        };
        let transfer_ctx = CpiContext::new(token_program.to_account_info(),transfer_accounts);
          token_2022::transfer(transfer_ctx,amount)?;

       Ok(())
}
```
### `add_hook`
Adds a hook program to whitelist (permissionless).
pub fn add_hook(ctx:Context<AddHook>,hook:Pubkey) -> Result<()>{
    let whitelist = &mut ctx.accounts.whitelist;
    
        require_keys_eq!(ctx.accounts.admin.key(),whitelist.admin,CustomError::HookNotWhitelisted);
        
            whitelist.allowed_hooks.push(hook);
         
         Ok(())

}

## KYC Hook Program
the **KYC HOOK** is a transfer hook program that enforces know your custommer (kyc)
 rule before allowing token transfers.
 it maintains a whitelist of approved wallet address and validate each transfer by checking if the sender is on this list

## key features:
---
 - `initialize` - creates a KYC registry with an admin
 - `Add/Remove Users` - Admin can whitelist or remove address.
 - `Pre-Transfer Hook` - Called automatically ( or by our middleware) before a transfer to block unverified users.
 - `Security` - Only the admin can modify the whitelist

This ensure that only `KYC-verified participants can trade or transfer tokens, supporting compliance in Token-2022-based systems

## `KYC_hook` full implementation:
 ---
 ```rust
 use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Token2022, TransferHook};

declare_id!("ad48sdywoahblaueiwohgoahdiwy");

#[program]
pub mod kyc_hook {
    use super::*;

    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let registry = &mut ctx.accounts.kyc_registry;
        registry.admin = ctx.accounts.admin.key();
        Ok(())
    }

    /// Add a user to the whitelist
    pub fn add_user(ctx: Context<ModifyKyc>, user: Pubkey) -> Result<()> {
        let registry = &mut ctx.accounts.kyc_registry;
        require_keys_eq!(registry.admin, ctx.accounts.admin.key(), CustomError::Unauthorized);
        
        if !registry.whitelist.contains(&user) {
            registry.whitelist.push(user);
        }
        Ok(())
    }

    /// Remove a user from the whitelist
    pub fn remove_user(ctx: Context<ModifyKyc>, user: Pubkey) -> Result<()> {
        let registry = &mut ctx.accounts.kyc_registry;
        require_keys_eq!(registry.admin, ctx.accounts.admin.key(), CustomError::Unauthorized);
        
        registry.whitelist.retain(|&u| u != user);
        Ok(())
    }

    /// Pre-transfer hook (called by middleware that our simulate_hook function inside our token2022_middleware_wraper program)
    pub fn pre_transfer_hook(ctx: Context<PreTransferHook>, _amount: u64) -> Result<()> {
        let registry = &ctx.accounts.kyc_registry;
        let sender = ctx.accounts.source_authority.key();
        require!(registry.whitelist.contains(&sender), CustomError::KycFailed);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + 32 + (32 * 100), 
        seeds = [b"kyc_registry"],
        bump
    )]
    pub kyc_registry: Account<'info, KycRegistry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyKyc<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub kyc_registry: Account<'info, KycRegistry>,
}

#[derive(Accounts)]
pub struct PreTransferHook<'info> {
    pub kyc_registry: Account<'info, KycRegistry>,

    /// CHECK: Verified in KYC logic
    pub source_authority: UncheckedAccount<'info>,
}

#[account]
pub struct KycRegistry {
    pub admin: Pubkey,
    pub whitelist: Vec<Pubkey>,
}

#[error_code]
pub enum CustomError {
    #[msg("User is not KYC verified")]
    KycFailed,
    #[msg("You are not authorized")]
    Unauthorized,
}
```

## What’s Implemented - Bounty Fulfilled:
- Middleware program:
  - `validate_and_swap`
  - `create_token_with_hook`
  - `simulate_hook`
  - `proxy_wrap` / `proxy_unwrap`
  - `add_hook` + whitelist logic
- Frontend UI:
  - Create Token page
  - Create Pool page
  - Swap page
  - Deposit
  - Liquidity Records
- Pre-transfer simulation + whitelist enforcement

---
- Kyc Hook Program:
  - add_user
  - remove_user
  - pre transfer hook
---


Frontend Integration
Connect wallet with `@solana/wallet-adapter.`
Connection with `@solana/web3.js`
Anchor client with `@coral-xyz/anchor`
Import generated IDL.

## Client Anchor file
### this file connect with smart contract from client.
```typescript

import { AnchorProvider, Program, web3, BN } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "./idl.json"; 
import { useWallet } from "@solana/wallet-adapter-react";

const programID = new web3.PublicKey("je033sd668278adfadfaitujsd"); 
const network = web3.clusterApiUrl("devnet"); 
const opts = { preflightCommitment: "processed" as web3.Commitment };

export const useAnchorProgram = () => {
  const wallet = useWallet();
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new AnchorProvider(connection, wallet, opts);
  const program = new Program(idl as any, programID, provider);

  return { program, wallet, connection };
};
```

---

Create Anchor Program instance.

Call:

create_token_with_hook for token creation.

validate_and_swap for swaps.

Middleware handles proxy PDA logic.

## Our Middleware idl.json
 ```json
  {
  "version": "0.1.0",
  "name": "token2022_middleware_wraper",
  "instructions": [
    {
      "name": "validateAndSwap",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "userSource", "isMut": true, "isSigner": false },
        { "name": "userDestination", "isMut": true, "isSigner": false },
        { "name": "tokenMint", "isMut": true, "isSigner": false },
        { "name": "proxyTokenAccount", "isMut": true, "isSigner": false },
        { "name": "proxyMint", "isMut": true, "isSigner": false },
        { "name": "poolSource", "isMut": true, "isSigner": false },
        { "name": "poolDestination", "isMut": true, "isSigner": false },
        { "name": "raydiumProgram", "isMut": false, "isSigner": false },
        { "name": "hookProgram", "isMut": false, "isSigner": false },
        { "name": "whitelist", "isMut": true, "isSigner": false },
        { "name": "ammProgram", "isMut": false, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "amountIn", "type": "u64" },
        { "name": "minAmountOut", "type": "u64" }
      ]
    },
    {
      "name": "createTokenWithHook",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "mint", "isMut": true, "isSigner": false },
        { "name": "userTokenAccount", "isMut": true, "isSigner": false },
        { "name": "whitelist", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "decimals", "type": "u8" },
        { "name": "initialSupply", "type": "u64" },
        { "name": "hookProgram", "type": "publicKey" }
      ]
    },
    {
      "name": "addHook",
      "accounts": [
        { "name": "admin", "isMut": true, "isSigner": true },
        { "name": "whitelist", "isMut": true, "isSigner": false }
      ],
      "args": [
        { "name": "hook", "type": "publicKey" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Whitelist",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "admin", "type": "publicKey" },
          { "name": "allowedHooks", "type": { "vec": "publicKey" } }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "HookValidationFailed",
      "msg": "Transfer Hook validation failed"
    },
    {
      "code": 6001,
      "name": "HookNotWhitelisted",
      "msg": "Hook program not whitelisted"
    }
  ],
  "metadata": {
    "address": "je033sd668278adfadfaitujsd"
  }
}
```
## Our Kyc Hook idl.json
```json

{
  "version": "0.1.0",
  "name": "kyc_hook",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "admin", "isMut": true, "isSigner": true },
        { "name": "kycRegistry", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "addUser",
      "accounts": [
        { "name": "admin", "isMut": true, "isSigner": true },
        { "name": "kycRegistry", "isMut": true, "isSigner": false }
      ],
      "args": [
        { "name": "user", "type": "publicKey" }
      ]
    },
    {
      "name": "removeUser",
      "accounts": [
        { "name": "admin", "isMut": true, "isSigner": true },
        { "name": "kycRegistry", "isMut": true, "isSigner": false }
      ],
      "args": [
        { "name": "user", "type": "publicKey" }
      ]
    },
    {
      "name": "preTransferHook",
      "accounts": [
        { "name": "kycRegistry", "isMut": false, "isSigner": false },
        { "name": "sourceAuthority", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "_amount", "type": "u64" }
      ]
    }
  ]
}
```
---

## Our Short Demo Video
[https://youtu.be/Vtu9joso_Sc]

## Contributors
`Twitter`
@DevDpro
@elmajeedabbas

