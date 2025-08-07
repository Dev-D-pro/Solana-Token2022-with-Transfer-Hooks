import { useEffect, useRef, useState } from "react";

  
export default function Tabs(){
 var [currentTab, changeTab]= useState<Array<null>>([]);
        var listener = (event:any)=>{
            let curObject = event.target;
                   var width = curObject.offsetWidth, index = curObject.offsetLeft;
                     alert()
                      changeTab([width,index])
        } 
        useEffect(()=>{
            let indicator = document.querySelector(".tab-indicator");
                
        })
return(
    <div className="tab-container">
              <div className="tab-container-box">
                   <div className="tab1" onClick={listener} >Tokens</div>
                    <div className="tab2" onClick={listener} >LP Loop</div>
                     <div className="tab3" onClick={listener} >Transactions</div>
              </div>
              <div className="tab-indicator-container" >
                 <div className="tab-indicator" ></div>
              </div>
    </div>
);
}
