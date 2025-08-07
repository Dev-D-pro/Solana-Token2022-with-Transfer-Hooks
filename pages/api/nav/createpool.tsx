
export default function Pool(){
      return (
         <div className="create-pool-container">
                  <div className="pool-header">
                     <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#fff"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>
                       <span>Create Liquidity Pool</span>
                  </div>
                    <div className="pool-tokens">
                         <div className="pool-choose-tokens">
                              Select Tokens
                         </div>
                        <div className="pool-token-a">
                                <img src="/icon/solana.png" className="wallet-icon" width="21px" height="21px"/>
                   <span>SOL</span>
                       <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#b1b1b1"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                        </div>
                         <div className="pool-token-b">
                     <img src="/icon/usdc.png" className="wallet-icon" width="21px" height="21px"/>
                   <span>USDC</span>
                       <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#b1b1b1"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                         </div>
                    </div>
                      <div className="token-value-container">
                          <div className="token-value-label">
                             <span>Deposit Amount</span>
                          </div>
                            <div className="value-for-tokenA">
                                  <div className="wallet-balance">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#84919b"><path d="M240-160q-66 0-113-47T80-320v-320q0-66 47-113t113-47h480q66 0 113 47t47 113v320q0 66-47 113t-113 47H240Zm0-480h480q22 0 42 5t38 16v-21q0-33-23.5-56.5T720-720H240q-33 0-56.5 23.5T160-640v21q18-11 38-16t42-5Zm-74 130 445 108q9 2 18 0t17-8l139-116q-11-15-28-24.5t-37-9.5H240q-26 0-45.5 13.5T166-510Z"/></svg>
                                    <span>0</span>
                                  </div>
                                  <div className="tokenA-input">
                                      <div className="tokenA-logo-symbol">
                                         <img src="/icon/solana.png" className="wallet-icon" width="21px" height="21px"/>
                                          <span>SOL</span>
                                      </div>
                                       <div>
                                      <input type="number" placeholder="0" />
                                       </div>
                                  </div>
                            </div>
                          <div className="middle-add-icon"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg></div>
                          <div className="value-for-tokenB">
                             <div className="wallet-balance">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#84919b"><path d="M240-160q-66 0-113-47T80-320v-320q0-66 47-113t113-47h480q66 0 113 47t47 113v320q0 66-47 113t-113 47H240Zm0-480h480q22 0 42 5t38 16v-21q0-33-23.5-56.5T720-720H240q-33 0-56.5 23.5T160-640v21q18-11 38-16t42-5Zm-74 130 445 108q9 2 18 0t17-8l139-116q-11-15-28-24.5t-37-9.5H240q-26 0-45.5 13.5T166-510Z"/></svg>
                                  <span>0</span>
                             </div>
                             <div className="tokenB-input">
                                <div className="tokenB-logo-symbol">
                                    <img src="/icon/usdc.png" className="wallet-icon" width="21px" height="21px"/>
                                    <span>USDC</span>
                                </div>
                                <div>
                                <input type="number"  />
                                </div>
                             </div>
                          </div>
                           <div className="total-deposit-container">
                                 <span className="total-deposit-label">Total Deposit</span>
                                  <span className="total-deposit-amount">$2000</span>
                           </div>
                           <div className="deposit-button">Deposit</div>
                      </div>
         </div>
      );
}