import { useEffect, useState } from "react";
import Header from "./header";
import Tabs from "./tabs";

import CreateToken from "./createtoken";
import Pool from "./createpool";
import Swap from "./swaptoken";
import TokenList from "./tokenlist";
export default function Dashboard(){
     const [curIndex,tabChange] = useState<number>(1);
     const [curpage,changePage] = useState<string | null>(null);
     const [curData,datachange] = useState<any>([]);
        
     useEffect(()=>{
                if(window !== undefined){
         let ObjectValue = localStorage.getItem("ObjectValue");
              if(ObjectValue){
                  ObjectValue = JSON.parse(ObjectValue);
              }
                         datachange(Array.from(Object.entries(ObjectValue||{})));
             }
              
     },[curpage]);
      useEffect(()=>{
           
      },[curIndex]);
       const createtoken = ()=>{
        changePage('token');
       }
       const createpool = ()=>{
          changePage('pool');
       }
       const swaptoken = ()=>{
           changePage('swap');
       }
    return(
        <div className="dashboard-container">
               <div style={{display:`${curpage==null?'none':'block'}`}} className="page-overlay">
                {curpage == 'token'?<CreateToken onDestroy={changePage}></CreateToken>:''}
                {curpage == 'pool'?<Pool onDestroy={changePage}></Pool>:''}
                {curpage == 'swap'?<Swap onDestroy={changePage}></Swap>:''}
               </div>
                     <Header></Header>
                <div className="dashboard-body">
                         <div className="available-coin-container">
                           <div className="change-wallet">
                            <img src="/icon/solana.png" className="wallet-icon" width="21px" height="21px"/>
                              <span>Wallet 1</span>
                              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#b1b1b1"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                           </div>
                             <div className="asset">
                               $500
                             </div>
                             <div className="dashboard-transfer">
                                 <div className="create-token" onClick={createtoken}>
                            <div className="ctoken-background">
<svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#fff"><path d="M480-80 120-280v-400l360-200 360 200v400L480-80ZM364-590q23-24 53-37t63-13q33 0 63 13t53 37l120-67-236-131-236 131 120 67Zm76 396v-131q-54-14-87-57t-33-98q0-11 1-20.5t4-19.5l-125-70v263l240 133Zm40-206q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Zm40 206 240-133v-263l-125 70q3 10 4 19.5t1 20.5q0 55-33 98t-87 57v131Z"/></svg>
                            </div>
                             <span className="label">Create Token</span>
                                 </div>
                                  <div className="create-pool" onClick={createpool}>
                           <div className="ctoken-background">
<svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#fff"><path d="M220-260q-92 0-156-64T0-480q0-92 64-156t156-64q37 0 71 13t61 37l68 62-60 54-62-56q-16-14-36-22t-42-8q-58 0-99 41t-41 99q0 58 41 99t99 41q22 0 42-8t36-22l310-280q27-24 61-37t71-13q92 0 156 64t64 156q0 92-64 156t-156 64q-37 0-71-13t-61-37l-68-62 60-54 62 56q16 14 36 22t42 8q58 0 99-41t41-99q0-58-41-99t-99-41q-22 0-42 8t-36 22L352-310q-27 24-61 37t-71 13Z"/></svg>
                            </div>
                             <span className="label">Create Pool</span> 
                                  </div>
                                   <div className="deposit-token">
                              <div className="ctoken-background"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#fff"><path d="M520-120v-80h184L520-384v-112l240 240v-184h80v320H520ZM240-280v-40H120v-80h240v-120H200q-33 0-56.5-23.5T120-600v-120q0-33 23.5-56.5T200-800h40v-40h80v40h120v80H200v120h160q33 0 56.5 23.5T440-520v120q0 33-23.5 56.5T360-320h-40v40h-80Z"/></svg>
                            </div>
                             <span className="label">Deposit</span>
                                   </div>
                                   <div className="swap-token" onClick={swaptoken}>
                              <div className="ctoken-background">
<svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="20 -960 960 960" width="21px" fill="#fff"><path d="M280-160 80-360l200-200 56 57-103 103h287v80H233l103 103-56 57Zm400-240-56-57 103-103H440v-80h287L624-743l56-57 200 200-200 200Z"/></svg>
                            </div>
                             <span className="label">Swap</span>
                                   </div>
                             </div>
                         </div>
                         <Tabs click={tabChange}></Tabs>
                          {curIndex == 1 ?<TokenList data={curData}></TokenList>:""}

                </div>
        </div>
    )
}
