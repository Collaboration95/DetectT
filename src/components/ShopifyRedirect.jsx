import React from "react";
import { useParams } from "react-router-dom";
import ExtractData from "./ExtractData";

export default function ShopifyRedirect() {
    const { sessionid} = useParams();
return (
    <div>
      {sessionid ? (
        <div>
          <div className="font-mono text-lg text-center m-[20px]">sessionID is: {sessionid}</div>
          <ExtractData sessionid={sessionid} />
        </div>
      ) : (
        <>
          
          <div className="font-mono text-lg text-center m-[20px]">SessionID is missing</div>
          <div className="font-mono text-lg text-center m-[20px]">You have broken out of the matrix , your salvation lies ahead

          </div>
        </>
      )}
    </div>
  );
}

