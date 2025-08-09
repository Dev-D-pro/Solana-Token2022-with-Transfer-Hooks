import { useState } from "react"

type properties = {
    data:Array<Array<string>>,
     title:string,
     selected:(value:number) => void,
     onDestroy:(msg:string| null)=> void
}
export default function Select({data,title,selected,onDestroy}:properties){

    const listener = (index:number)=>{
         
             selected(index);
             onDestroy(null);
    }
    return (
      <div className="select-container">
          <div className="select-box">
             <div className="select-label">
                  <span>{title}</span>
             </div>
             <div className="token-list">
                        {
                            data.map((list,index)=>  
                            <div className="each-token" onClick={()=>listener(index)}>
                                <span>{list[0]}</span>
                                 <span>{list[1]}</span>
                            </div> )
                        }
                         
             </div>
             </div>
      </div>
    );
}
