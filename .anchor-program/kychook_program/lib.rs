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
