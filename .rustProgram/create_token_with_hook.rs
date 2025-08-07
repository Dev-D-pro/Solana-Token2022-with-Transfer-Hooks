use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Mint, Token, InitializeMint2, MintTo};
use anchor_lang::solana_program::system_program;

declare_id!("sftswap7031668278");

#[program]
pub mod token2022_middleware {
    use super::*;

    /// Create a token and attach a hook program
    pub fn create_token_with_hook(
        ctx: Context<CreateTokenWithHook>, 
        decimals: u8,
        initial_supply: u64,
        hook_program: Pubkey,
    ) -> Result<()> {
        // Step 1: Initialize mint with hook authority
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
            Some(&hook_program), // attach hook program here
        )?;

        // Step 2: Mint initial supply to user
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

        // Step 3: Update whitelist
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

#[account]
pub struct Whitelist {
    pub admin: Pubkey,
    pub allowed_hooks: Vec<Pubkey>,
}