use anchor_lang::prelude::*;
use anchor_spl::token_2022;
use anchor_lang::solana_program::{
     instruction::{AccountMeta,Instruction},
     program::invoke,
}
use anchor_lang::solana_program::system_program;
use anchor_spl::token_2022::{self,Token, TokenAccount, Transfer, Mint,Burn,InitializeMint2, MintTo};

declare_id!("je033sd668278adfadfaitujsd");

#[program]
pub mod token2022_middleware_wraper {
    use super::*;
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
}

#[derive(Accounts)]
pub struct CreateTokenWithHook<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 82, // space for Mint
        seeds = [b"mint", user.key().as_ref()],
        bump,
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info, token_2022::TokenAccount>,

    #[account(mut)]
    pub whitelist: Account<'info, Whitelist>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
   

     
}
#[derive(Accounts)]
pub struct ValidateAndSwap<'info> {
 #[account(mut)]
 pub user: Signer<'info>,
  
  #[account(mut)]
    pub user_source: Account<'info,TokenAccount>,

    #[account(mut)]
    pub user_destination: Account<'info,TokenAccount>,

    #[account(mut)]
    pub token_mint: Account<'info,Mint>,
  
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
    
    pub hook_program: UncheckedAccount<'info>,
    #[account(mut)]
       pub whitelist: AccountInfo<'info>,
  
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
//invoke amm swap this is where the real trade happens
fn invoke_amm_swap(ctx:&Context<ValidateAndSwap>,amount_in:u64,min_amount_out:u64) -> Result<()>{
     
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

pub fn add_hook(ctx:Context<AddHook>,hook:Pubkey) -> Result<()>{
    let whitelist = &mut ctx.accounts.whitelist;
    
        require_keys_eq!(ctx.accounts.admin.key(),whitelist.admin,CustomError::HookNotWhitelisted);
        
         if ! whitelist.allowed_hooks.contains(&hook) {
            whitelist.allowed_hooks.push(hook);
         }
         Ok(())

}
