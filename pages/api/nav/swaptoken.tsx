
type properties ={
    onDestroy:(destroy:string|null) => void
}
export default function Swap({onDestroy}:properties){
return (
     <div className="swap-container">
         <div className="swap-header" onClick={()=>{onDestroy(null)}}>
            <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#fff"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>
                <span>Swap</span>
         </div>
       <div className="swap-box">
            <div className="swap-pay">
                  <div className="pay-label">
                       <span>You Pay</span>
                  </div>
                   <div className="pay-detail">
                     <div className="detail-input">
                          <input type="number" placeholder="0"/>
                     </div>
                      <div className="pay-token">
                         <img src="/icon/solana.png" className="wallet-icon" width="21px" height="21px"/>
                           <span>SOL</span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#b1b1b1"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                      </div>
                   </div>
            </div>
              <div className="swap-change">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M320-440v-287L217-624l-57-56 200-200 200 200-57 56-103-103v287h-80ZM600-80 400-280l57-56 103 103v-287h80v287l103-103 57 56L600-80Z"/></svg>
              </div>
             <div className="swap-recieve">
                   <div className="pay-label">
                       <span>You Recieve</span>
                   </div>
                     <div className="recieve-detail">
                          <div className="recieve-input">
                              <input type="number" placeholder="0" />
                          </div>
                           <div className="recieve-token">
                             <img src="/icon/usdc.png" className="wallet-icon" width="21px" height="21px"/>
                   <span>USDC</span>
                       <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#b1b1b1"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                           </div>
                     </div>
             </div>
         </div>      
         <div className="swap-button">
                 Swap Tokens
             </div>    
       <div className="pricing-container">
                <div className="price-equivalent">
                      <span>Pricing</span> <span>1 SOL = 166 USDC</span>
                </div>
                <div className="fee">
                     <span>
                        Fees
                     </span>
                      <span>
                           $0.5
                      </span>
                </div>
       </div>
     </div>
)
}