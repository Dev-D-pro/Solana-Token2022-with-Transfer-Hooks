import { useEffect, useState } from "react";
import Select from "../modal/select";
type properties ={
    onDestroy:(destroy:string|null) => void
}
export default function CreateToken({onDestroy}:properties){
     let [tokenname,changetokenname] = useState<string>("");
      let [symbol,changesymbol] = useState<string>("");
      let [inisupply,changeinisupply] = useState<string>("");
      let [hooktype,changehooktype] = useState<string>();
      let [storedtoken,storedchange] = useState<any>([]);
      
    useEffect(()=>{
       if(window !== undefined){
         let ObjectValue = localStorage.getItem("ObjectValue");
              if(ObjectValue){
                  ObjectValue = JSON.parse(ObjectValue);
              }
                storedchange(ObjectValue||{});
       }
              
    },[]);
   const [curpage,changePage] = useState<string | null>(null);
     let data = [["Whitelist Hook",""],["Transfer Limit Hook","amount < $20000"]]
     const selectedData = (index:number)=>{
       let hookLabel =  document.querySelector(".hook-type > span");
       hookLabel.textContent = data[index][0];
          changehooktype(data[index][0]);
     }
      const selectHook = ()=>{
              changePage("select");
      }
      const oncreate = ()=>{
            let tokenmap = new Map(Object.entries(storedtoken));
                tokenmap.set(tokenname,{
                    balance:inisupply,
                    program_id:'',
                   icon:"",
                   unitindollar:0,
                   symbol:symbol,
                   address:"",
                });
                 if(tokenname!==""&&symbol!==""&&hooktype!==undefined){
               localStorage.setItem("ObjectValue",JSON.stringify(Object.fromEntries(tokenmap.entries())));
                 }
                 setTimeout(()=>{
                  alert("Token with name "+tokenname+" has been created with address UEjkdiadeidhNE3RHjkiea");
                  onDestroy(null);
                 },1500);
      }
      
    return(
        
       <div className="create-token-container">
          <div style={{display:`${curpage==null?'none':'block'}`}} className="page-overlay">
           {curpage == 'select'?<Select onDestroy={changePage} title="Select Hook" data={data} selected={selectedData} ></Select>:''}
          </div>
              <div className="create-token-label" onClick={()=>{onDestroy(null)}}>
                 <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#fff"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>
                 <span>Create Token</span>
              </div>
                <div className="create-token-name">
                    <input type="text" placeholder="Enter Token Name" onChange={(e)=>{changetokenname(e.target.value)}} />
                </div>
                <div className="symbol" >
                     <input type="text" placeholder="Token Symbol e.g SOL" onChange={(e)=>changesymbol(e.target.value)}/>
                </div>
                 <div className="initial-supply" >
                      <input type="number"  placeholder="Initial Supply" onChange={(e)=>{changeinisupply(e.target.value)}}/>
                 </div>
                  <div className="hook-type" onClick={selectHook}>
                       <span>Select Hook</span>
                  </div>
                  <div className="create-token-button" onClick={oncreate}>
                     <span>Create Token</span>
                  </div>
        </div>
        
    );
}
