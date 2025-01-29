// import React, { useEffect,useState } from "react";
// import Webcam from "react-webcam";

// const WebcamFeed = ({ webcamRef, canvasRef }) => {

//   useEffect(() => {
//     // Request camera permissions before initializing the webcam
//     navigator.mediaDevices.getUserMedia({ video: true })
//       .then(() => console.log("Camera permission granted"))
//       .catch(err => {
//         console.error("Camera permission denied:", err);
//         alert("Camera permission denied: " + err.message);
//       });
//   }, []);


//   return (  
//   <div style={{ position: 'relative', width: 640, height: 480 }}>
//     {/* Hidden webcam element with active video stream */}
//     <Webcam
//       audio={false}
//       ref={webcamRef}
//       width={640}
//       height={480}
//       screenshotFormat="image/jpeg"
//       videoConstraints={{
//         width: 640,
//         height: 480,
//         facingMode: "user",
//       }}
//       style={{
//         position: 'absolute',
//         opacity: 0,
//         zIndex: -1,
//         pointerEvents: 'none',
//       }}
//     />
    
//     {/* Visible canvas */}
//     <canvas 
//       ref={canvasRef} 
//       style={{
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         // transform: 'scaleX(-1)' // Mirror the canvas
//       }} 
//       width={640}
//       height={480}
//     />
//   </div>
// );
// }
// export default WebcamFeed;

import { useState, useEffect } from "react";
import Webcam from "react-webcam";

const WebcamFeed = ({ webcamRef, canvasRef }) => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth > 640 ? 640 : window.innerWidth - 20,
    height: window.innerHeight > 480 ? 480 : window.innerHeight / 2,
  });

  useEffect(() => {
    // Request camera permissions before initializing the webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => console.log("Camera permission granted"))
      .catch(err => {
        console.error("Camera permission denied:", err);
        alert("Camera permission denied: " + err.message);
      });

    // Update dimensions on window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth > 640 ? 640 : window.innerWidth - 20,
        height: window.innerHeight > 480 ? 480 : window.innerHeight / 2,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ position: "relative", width: dimensions.width, height: dimensions.height }}>
      {/* Hidden webcam element with active video stream */}
      <Webcam
        audio={false}
        ref={webcamRef}
        width={dimensions.width}
        height={dimensions.height}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: dimensions.width,
          height: dimensions.height,
          facingMode: "user", // Adjusts automatically for mobile
        }}
        style={{
          position: "absolute",
          opacity: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      {/* Visible canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};

export default WebcamFeed;
