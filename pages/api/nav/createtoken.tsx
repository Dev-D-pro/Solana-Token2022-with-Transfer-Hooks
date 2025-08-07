

export default function CreateToken(){
 
    return(
        <div className="create-token-container">
              <div className="create-token-label">
                 <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#fff"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>
                 <span>Create Token</span>
              </div>
                <div className="create-token-name">
                    <input type="text" placeholder="Enter Token Name"  />
                </div>
                <div className="symbol" >
                     <input type="text" placeholder="Token Symbol e.g SOL" />
                </div>
                 <div className="initial-supply" >
                      <input type="number"  placeholder="Initial Supply"/>
                 </div>
                  <div className="hook-type" >
                       <span>Select Hook</span>
                  </div>
                  <div className="create-token-button">
                     <span>Create Token</span>
                  </div>
        </div>
    );
}
