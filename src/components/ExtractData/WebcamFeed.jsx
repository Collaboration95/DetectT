import React, { useRef } from "react";
import Webcam from "react-webcam";


const WebcamFeed = ({ webcamRef, canvasRef }) => (
  <div style={{ position: 'relative', width: 640, height: 480 }}>
    {/* Hidden webcam element with active video stream */}
    <Webcam
      audio={false}
      ref={webcamRef}
      width={640}
      height={480}
      screenshotFormat="image/jpeg"
      videoConstraints={{
        width: 640,
        height: 480,
        facingMode: "user",
      }}
      style={{
        position: 'absolute',
        opacity: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
    
    {/* Visible canvas */}
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        // transform: 'scaleX(-1)' // Mirror the canvas
      }} 
      width={640}
      height={480}
    />
  </div>
);
export default WebcamFeed;
