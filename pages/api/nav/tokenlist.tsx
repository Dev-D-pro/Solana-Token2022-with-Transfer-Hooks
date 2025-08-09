import { useEffect, useState } from "react";

type properties = {
data:Array<Object>,
};
export default function TokenList({data}:properties){
      let [ddata,dchange] = useState<any>(data);
      useEffect(()=>{
        console.log(data)
             dchange(data);
      },[data]);
    return (
  <div className="token-information">
                   {
                      ddata.map((e:any)=>
                           
                        <div className="token-container">
                                    <div className="token-icon">
                             
                      {e[1].icon !==""?<img src={`${e[1].icon}`}  width="21px" height="21px"/>:new String(e[1].symbol).charAt(0)}
                                    </div>
                                        <div className="token-value">
                                                <div className="token-label">
                                                      <span>{e[1].symbol}</span>
                                                      <span>${e[1].unitindollar}</span>
                                                </div>
                                                  <div className="token-avail">
                                                       <span>{e[1].balance}</span>
                                                          <span>${e[1].unitindollar}</span>
                                                  </div>
                                        </div>
                              </div>
                      )
                   }
                          </div>
    );
}