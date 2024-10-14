import React, { useRef } from 'react';
import Webcam from "react-webcam";

const WebcamFeed = ({ webcamRef, canvasRef }) => (
  <div className="mt-4 flex justify-around w-full">
    <div>
      <h2 className="text-center mb-2">Original Feed</h2>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
        }}
        className="w-full h-full object-cover"
      />
    </div>
    <div>
      <h2 className="text-center mb-2">Mirrored Feed with Skeleton</h2>
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
    </div>
  </div>
);

export default WebcamFeed;