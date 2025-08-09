import { useEffect, useState } from "react";
import Select from "../modal/select";

type properties ={
    onDestroy:(destroy:string|null) => void
}
export default function Pool({onDestroy}:properties){
    const [curpage,changePage] = useState<string | null>(null);
      let [storedtoken,storedchange] = useState<any>([]);
      let [originValue,changeOriginal] = useState<any>({});
      let initialValue = ["solana","usdc"];
   
       
      useEffect(()=>{
      
            if(window !== undefined){
              let ObjectValue:any = [];
                       ObjectValue = localStorage.getItem("ObjectValue");
                   if(ObjectValue){
                        changeOriginal(JSON.parse(ObjectValue));
                       ObjectValue = Array.from(Object.entries(JSON.parse(ObjectValue)));
                       let newValue= ObjectValue.map((e:any)=>[e[0],e[1].symbol]);
                        storedchange(newValue);
                   }
               
                     
            }
      
               
         },[]);
 setTimeout(()=>{
 var span = document.querySelector(".value-for-tokenA > .wallet-balance > span");
                 span.textContent =  originValue[initialValue[0]]?.balance;

               var token1value = document.querySelector(".tokenA-logo-symbol > span");
               token1value.textContent =  originValue[initialValue[0]]?.symbol;

               var span = document.querySelector(".value-for-tokenB > .wallet-balance > span");
             span.textContent =  originValue[initialValue[1]]?.balance;
            var token2value = document.querySelector(".tokenB-logo-symbol > span");
               token2value.textContent =  originValue[initialValue[1]]?.symbol;
                   
 },100)
    const token1 = (index:number)=>{
              initialValue[0] = storedtoken[index][0];
                var span = document.querySelector(".value-for-tokenA > .wallet-balance > span");
             span.textContent =  originValue[initialValue[0]]?.balance;

               var token1value = document.querySelector(".tokenA-logo-symbol > span");
               token1value.textContent =  originValue[initialValue[0]]?.symbol;

           
           querySelect("pool-token-a",storedtoken,index);
    };
    const token2 = (index:number)=>{
       initialValue[1] = storedtoken[index][0];
       var span = document.querySelector(".value-for-tokenB > .wallet-balance > span");
             span.textContent =  originValue[initialValue[1]]?.balance;
            var token2value = document.querySelector(".tokenB-logo-symbol > span");
               token2value.textContent =  originValue[initialValue[1]]?.symbol;
            
querySelect("pool-token-b",storedtoken,index)
    }
    const triggertoken1 = ()=>{
        changePage("token1");
    }
    const triggertoken2 = ()=>{
       changePage("token2");
    }
    let priceValue1 = 0;
    let priceValue2 = 0;
    const computePriceToken1 = (e:any)=>{
          priceValue1=(parseInt(e)*parseInt(originValue[initialValue[0]].unitindollar));
          document.querySelector(".total-deposit-amount").textContent = '$'+(priceValue1+priceValue2)||0;
    }
    const computePriceToken2 = (e:any)=>{
     priceValue2 =(parseInt(e)*parseInt(originValue[initialValue[1]].unitindollar));
      document.querySelector(".total-deposit-amount").textContent = '$'+(priceValue1+priceValue2)||0;
    }
    const createLPbutton = ()=>{
setTimeout(()=>{
   alert("you just added liquidity pool with address RjadfhiEDj3ksdahkdah3hfadskl");
   onDestroy(null);
},1500);
    }
      return (
         
         <div className="create-pool-container">
             <div style={{display:`${curpage==null?'none':'block'}`}} className="page-overlay">
                       {curpage == 'token1'?<Select onDestroy={changePage} title="Select Base Token" data={storedtoken} selected={token1} ></Select>:''}
                         {curpage == 'token2'?<Select onDestroy={changePage} title="Select Token 2" data={storedtoken} selected={token2} ></Select>:''}
                      </div>
                  <div className="pool-header" onClick={()=>onDestroy(null)}>
                     <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#fff"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>
                       <span>Create Liquidity Pool</span>
                  </div>
                    <div className="pool-tokens">
                         <div className="pool-choose-tokens">
                              Select Tokens
                         </div>
                        <div className="pool-token-a" onClick={triggertoken1}>
                                <img src="/icon/solana.png" className="wallet-icon" width="21px" height="21px"/>
                   <span>SOL</span>
                       <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#b1b1b1"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                        </div>
                         <div className="pool-token-b" onClick={triggertoken2}>
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
                                       
                                          <span></span>
                                      </div>
                                       <div>
                                      <input type="number" placeholder="0" onChange={(e)=>computePriceToken1(e.target.value)}/>
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
                                   
                                    <span></span>
                                </div>
                                <div>
                                <input type="number"  placeholder="0" onChange={(e)=>computePriceToken2(e.target.value)}/>
                                </div>
                             </div>
                          </div>
                           <div className="total-deposit-container">
                                 <span className="total-deposit-label">Total Deposit</span>
                                  <span className="total-deposit-amount">$0</span>
                           </div>
                           <div className="deposit-button" onClick={createLPbutton}>Deposit</div>
                      </div>
         </div>
      );
}
function querySelect(query:string,data:any,index:number){
   
    let image = document.querySelector(`.${query} > img`);
            let span =  document.querySelector(`.${query} > span`);
         
           switch(data[index][0]){
            case "solana": 
               image.src = "/icon/solana.png";
                span.textContent = data[index][1];
                break;
               case "usdc":
                  image.src = "/icon/usdc.png";
                image.textContent = data[index][1];
                break;
               default:
                    image.src = '';
                 span.textContent = data[index][1];
                 
           }
}