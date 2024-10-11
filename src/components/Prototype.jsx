
import Button from "@mui/material/Button";
import React, { useState, useCallback, useRef } from "react";
import Webcam from "react-webcam";

import { Camera } from "lucide-react";

export default function Prototype() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const webcamRef = useRef(null);

  const toggleCamera = useCallback(() => {
    setIsCameraOn(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="font-mono text-3xl text-center mt-2 hover:text-red-900 transition-all duration-200 ease-linear">
        Prototype
      </h1>
      <div className="mt-4">
        <Button 
          variant="default" 
          onClick={toggleCamera}
          className="flex items-center"
        >
          <Camera className="mr-2 h-4 w-4" />
          {isCameraOn ? "Turn Off Camera" : "Launch Camera"}
        </Button>
      </div>
      {isCameraOn && (
        <div className="mt-4">
          <Webcam
            audio={false}
            forceScreenshotSourceSize={true}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            // videoConstraints={{
            //   width: 256,
            //   height: 256,
            //   facingMode: "user"
            // }}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
