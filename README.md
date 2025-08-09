# SftSwap — AMM Middleware with Token-2022 Hook Support

## Program Deployment

| Environment | Program ID |
|-------------|------------|
| Devnet      | `je033sd668278adfadfaitujsd` (placeholder) |

---

## Short Description
SftSwap is a middleware relayer that enables **Token-2022** tokens with active **Transfer Hooks** to be tradable on legacy Solana AMMs (e.g. Raydium).  
The middleware validates hook programs before swaps, enforces a whitelist of safe hooks, and uses proxy wrapping/unwrapping to ensure compatibility with AMMs that do not natively support token hooks.

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

### `simulate_hook`
Read-only CPI to hook program to test if transfer will pass.
```rust
fn simulate_hook(hook: &Pubkey, user:&Pubkey, amount:u64) -> Result<bool>{
  
    let ix = Instruction{
          program_id, *hook,accounts:vec![
              AccountMeta::new_readonly(*user,true),
          ],
          data:
          HookInstruction::SimulateTransfer{amount}.try_to_vec().unwrap,
    };
    let account_infos: Vec<AccountInfo> = vec![];
    let result = solana::program::invoke(&ix,&account_infos);
      match result {
          Ok(_) => Ok(true),
          Err(_) => Ok(false),
      }
}
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

### `add_hook`
Adds a hook program to whitelist (admin only).
pub fn add_hook(ctx:Context<AddHook>,hook:Pubkey) -> Result<()>{
    let whitelist = &mut ctx.accounts.whitelist;
    
        require_keys_eq!(ctx.accounts.admin.key(),whitelist.admin,CustomError::HookNotWhitelisted);
        
         if ! whitelist.allowed_hooks.contains(&hook) {
            whitelist.allowed_hooks.push(hook);
         }
         Ok(())

}
---

## What’s Implemented
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
- Pre-transfer simulation + whitelist enforcement

---

## Known Limitations
- Example hook programs (KYC, limits) not included.
- Hook approval is admin-only (not permissionless).

---

## Build & IDL (Anchor 0.29.x)

```bash
anchor build
# IDL: target/idl/<program_name>.json
# Binary: target/deploy/<program_name>.so

Frontend Integration
Connect wallet with @solana/wallet-adapter.

Import generated IDL.

Create Anchor Program instance.

Call:

create_token_with_hook for token creation.

validate_and_swap for swaps.

Middleware handles proxy PDA logic.



anchor deploy --provider.cluster devnet
---
## Contributors
@Dev-D-pro
@epitome

