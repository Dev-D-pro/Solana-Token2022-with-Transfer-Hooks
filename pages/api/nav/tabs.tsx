import { useEffect, useRef, useState } from "react";

  type paramProps = {
         click:(index:number) => void
  };
export default function Tabs({click}:paramProps){
 var [currentTab, changeTab]= useState<Array<null>>([]);
        var listener = (event:any,index:any)=>{
            let curObject = event.target;
                   var width = curObject.offsetWidth, index = curObject.offsetLeft;
                       let indicator = document.querySelector(".tab-indicator");
                           indicator.style.width = `${width}px`;
                            indicator.style.left = `${index}px`;
                               click(index);
        } 
return(
    <div className="tab-container">
              <div className="tab-container-box">
                   <div className="tab1" onClick={(event)=>{listener(event,1)}} ><span>Tokens</span></div>
                    <div className="tab2" onClick={(event)=>{listener(event,2)}} ><span>LP Loop</span></div>
                     <div className="tab3" onClick={(event)=>{listener(event,3)}} ><span>Transactions</span></div>
              </div>
              <div className="tab-indicator-container" >
                 <div className="tab-indicator" ></div>
              </div>
    </div>
);
}
