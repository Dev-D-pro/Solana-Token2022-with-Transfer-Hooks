use anchor_lang::prelude::*;
use anchor_spl::token_2022;
use anchor_lang::solana_program::{
     instruction::{AccountMeta,Instruction},
     program::invoke,
}
use anchor_spl::token_2022::{self,Token, TokenAccount, Transfer, Mint,Burn};

declare_id!("sftswap7031668278");

#[program]
pub mod token2022_middleware_wraper {
    use super::*;
        pub fn validate_and_swap(ctx:Context<ValidateAndSwap>,amount_in:u64,min_amount_out:u64,) -> Result<()>{
             let hook_program = &ctx.accounts.hook_program;
            //pre transfer simulation: call hook program read-only
             let hook_passed = simulate_hook(&hook_program.key(),&ctx.accounts.user.key(),amount_in)?;
             require!(hook_passed,CustomError:HookValidationFailed);

               // let check hook whitelist
               let whitelist = &ctx.accounts.whitelist.load()?;
                require!(whitelist.hooks.contains(&hook_program.key()),CustomError:HookNotWhitelisted);

                //wrap token if AMM doesn't support hook
                if ctx.accounts.amm_supports_hooks{
                      invoke_amm_swap(&ctx,amount_in,min_amount_out)?;
                }
                    else {
                    proxy_wrap(&ctx,amount_in)?;
                        invoke_amm_swap(&ctx,amount_in,min_amount_out)?;
                      proxy_unwrap(&ctx)?;
                   }
        }
   

     
}
#[derive(Accounts)]
pub struct ValidateAndSwap<'info> {
 #[account(mut)]
 pub user: Signer<'info>,
  //token being swapped #[account(mut)]
  #[account(mut)]
    pub user_source: Account<'info,TokenAccount>,

    #[account(mut)]
    pub user_destination: Account<'info,TokenAccount>,

    #[account(mut)]
    pub token_mint: Account<'info,Mint>,
    //proxy token accounts for wrap. unwrap
    #[account(mut)]
    pub proxy_token_account:
    Account<'info,TokenAccount>,
    #[account(mut)]
    pub proxy_mint: Account<'info,Mint>,
      #[account(mut)]
      pub pool_source:AccountInfo<'info>,
        #[account(mut)]
      pub pool_destination:AccountInfo<'info>,
     pub raydium_program:Account<'info>,
    //check: external hook program
    pub hook_program: UncheckedAccount<'info>,
    #[account(mut)]
       pub whitelist: AccountInfo<'info>,
    /// checked: target AMM program
    pub amm_program: UncheckedAccount<'info>,
    pub token_program: Program<'info,Token>,

}
#[account]
pub struct Whitelist {
      pub admin: Pubkey,
    pub allowed_hooks: Vec<Pubkey>,
}

#[derive(Accounts)]
pub struct AddHook<'info>{
    #[account(mut)]
      pub admin: Signer<'info>,
       pub whitelist: Account<'info, Whitelist>,
}

#[error_code]
pub enum CustomError {
    #[msg("Transfer Hook validation failed")]
    HookValidationFailed,
    #[msg("Hook program not whitelisted")]
      HookNotWhitelisted,
}

///simulate hook program logic (read-only)

fn simulate_hook(hook: &Pubkey, user:&Pubkey, amount:u64) -> Result<bool>{
    //build a CPI call to the hook program
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
//invoke amm swap this is where the real trade happens
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
         // step 3: re wrap into proxy if necessary
      proxy_wrap(&ctx,min_amount_out)?;
      
      Ok(());
}
#[derive(AnchorSerialize,AnchorDeserialize)]
pub enum RaydiumInstruction {
      Swap {amount_in: u64,min_amount_out:u64},
}
/// hook instructions enum (must match hook program)
#[derive(AnchorSerialize,AnchorDeserialize)]
pub enum HookInstruction {
    SimulateTransfer {amount:u64},
}

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

    //step 1: burn the users token-2022 amount ( qith hook logic already simulated);
    let burns_accounts = Burn{
         mint: proxy_mint.to_account_info(),
         from: user_source.to_account_info(),
          authority: user.to_account_info(),
    };
    let burn_ctx = CpiContext::new(token_program.to_account_info(),burns_accounts);   
        token_2022::burn(burn_ctx,amount)?;

        // step 2: transfer back original tokens from proxy to user
        let transfer_accounts = Transfer{
             from:user_source.to_account_info(),
             to: ctx.accounts.user_source.to_account_info(),
             authority: user.to_account_info(),
        };
        let transfer_ctx = CpiContext::new(token_program.to_account_info(),transfer_accounts);
          token_2022::transfer(transfer_ctx,amount)?;

       Ok(())
}

pub fn add_hook(ctx:Context<AddHook>,hook:Pubkey) -> Result<()>{
    let whitelist = &mut ctx.accounts.whitelist;
    //only the admin can update the whitelist
        require_keys_eq!(ctx.accounts.admin.key(),whitelist.admin,CustomError::HookNotWhitelisted);
        
         if ! whitelist.allowed_hooks.contains(&hook) {
            whitelist.allowed_hooks.push(hook);
         }
         Ok(())

}
