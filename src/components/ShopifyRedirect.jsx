import React from "react";
import { useParams } from "react-router-dom";

export default function ShopifyRedirect() {
    const { sessionid} = useParams();
return (
    <div>
      {sessionid ? (
        <div>
          
          <div className="font-mono text-lg text-center m-[20px]">sessionID is: {sessionid}</div>
        </div>
      ) : (
        <>
          
          <div className="font-mono text-lg text-center m-[20px]">SessionID is missing</div>
        </>
      )}
    </div>
  );
}