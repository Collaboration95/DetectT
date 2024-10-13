// import Button from "@mui/material/Button";
// import React, { useState, useCallback, useRef } from "react";
// import Webcam from "react-webcam";
// import * as posenet from "@tensorflow-models/posenet";
// import "@tensorflow/tfjs";

// import { Camera } from "lucide-react";

// export default function Prototype() {
//   const [isCameraOn, setIsCameraOn] = useState(false);
//   const webcamRef = useRef(null);

//   const toggleCamera = useCallback(() => {
//     setIsCameraOn((prev) => !prev);
//   }, []);

//   return (
//     <div className="flex flex-col items-center mt-4">
//       <h1 className="font-mono text-3xl text-center mt-2 hover:text-red-900 transition-all duration-200 ease-linear">
//         Prototype
//       </h1>
//       <div className="mt-4">
//         <Button
//           variant="default"
//           onClick={toggleCamera}
//           className="flex items-center"
//         >
//           <Camera className="mr-2 h-4 w-4" />
//           {isCameraOn ? "Turn Off Camera" : "Launch Camera"}
//         </Button>
//       </div>
//       {isCameraOn && (
//         <div className="mt-4">
//           <Webcam
//             audio={false}
//             forceScreenshotSourceSize={true}
//             ref={webcamRef}
//             screenshotFormat="image/jpeg"
//             // videoConstraints={{
//             //   width: 256,
//             //   height: 256,
//             //   facingMode: "user"
//             // }}
//             className="w-full h-full object-cover"
//           />
//         </div>
//       )}
//     </div>
//   );
// }
// import React, { useState, useCallback, useRef, useEffect } from "react";
// import Button from "@mui/material/Button";
// import Webcam from "react-webcam";
// import { Camera } from "lucide-react";
// import * as posenet from "@tensorflow-models/posenet";
// import "@tensorflow/tfjs";

// export default function Prototype() {
//   const [isCameraOn, setIsCameraOn] = useState(false);
//   const [isPoseDetectionOn, setIsPoseDetectionOn] = useState(false);
//   const [model, setModel] = useState(null);
//   const webcamRef = useRef(null);

//   const toggleCamera = useCallback(() => {
//     setIsCameraOn((prev) => !prev);
//   }, []);

//   const togglePoseDetection = useCallback(() => {
//     setIsPoseDetectionOn((prev) => !prev);
//   }, []);

//   useEffect(() => {
//     const loadModel = async () => {
//       const loadedModel = await posenet.load();
//       console.log('PoseNet model loaded:', loadedModel);
//       setModel(loadedModel);
//     };
//     loadModel();
//   }, []);

//   const detectPose = async () => {
//     if (
//       model &&
//       webcamRef.current &&
//       webcamRef.current.video.readyState === 4 &&
//       !webcamRef.current.video.paused // Ensure video is playing
//     ) {
//       const video = webcamRef.current.video;

//       // Detect pose from the video element
//       const pose = await model.estimateSinglePose(video, {
//         flipHorizontal: false,
//       });

//       console.log(pose); // Log the pose data
//     }
//   };

//   useEffect(() => {
//     let interval;
//     if (isCameraOn && isPoseDetectionOn) {
//       interval = setInterval(detectPose, 100); // Run detection every 100ms
//     } else if (interval) {
//       clearInterval(interval);
//     }
//     return () => clearInterval(interval);
//   }, [isCameraOn, isPoseDetectionOn, model]);

//   return (
//     <div className="flex flex-col items-center mt-4">
//       <h1 className="font-mono text-3xl text-center mt-2 hover:text-red-900 transition-all duration-200 ease-linear">
//         Prototype
//       </h1>
//       <div className="mt-4">
//         <Button
//           variant="default"
//           onClick={toggleCamera}
//           className="flex items-center"
//         >
//           <Camera className="mr-2 h-4 w-4" />
//           {isCameraOn ? "Turn Off Camera" : "Launch Camera"}
//         </Button>

//         {isCameraOn && (
//           <div className="mt-4">
//             <Button
//               variant="default"
//               onClick={togglePoseDetection}
//               className="flex items-center"
//             >
//               {isPoseDetectionOn ? "Stop Pose Detection" : "Start Pose Detection"}
//             </Button>
//           </div>
//         )}
//       </div>

//       {isCameraOn && (
//         <div className="mt-4">
//           <Webcam
//             audio={false}
//             ref={webcamRef}
//             screenshotFormat="image/jpeg"
//             videoConstraints={{
//               width: 640,
//               height: 480,
//               facingMode: "user", // Using user camera
//             }}
//             className="w-full h-full object-cover"
//           />
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useCallback, useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import Webcam from "react-webcam";
import { Camera } from "lucide-react";
import * as posenet from "@tensorflow-models/posenet";
import "@tensorflow/tfjs";

export default function Prototype() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isPoseDetectionOn, setIsPoseDetectionOn] = useState(false);
  const [model, setModel] = useState(null);
  const webcamRef = useRef(null);

  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
  }, []);

  const togglePoseDetection = useCallback(() => {
    setIsPoseDetectionOn((prev) => !prev);
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await posenet.load();
      console.log('PoseNet model loaded:', loadedModel);
      setModel(loadedModel);
    };
    loadModel();
  }, []);

  const detectPose = async () => {
    if (
      model &&
      webcamRef.current &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      
      // Get the dimensions of the video
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Set the video width and height
      video.width = videoWidth;
      video.height = videoHeight;

      // Detect pose from the video element
      const pose = await model.estimateSinglePose(video, {
        flipHorizontal: false,
      });

      console.log(pose); // Log the pose data
    }
  };

  useEffect(() => {
    let interval;
    if (isCameraOn && isPoseDetectionOn) {
      interval = setInterval(detectPose, 100); // Run detection every 100ms
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isCameraOn, isPoseDetectionOn, model]);

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

        {isCameraOn && (
          <div className="mt-4">
            <Button
              variant="default"
              onClick={togglePoseDetection}
              className="flex items-center"
            >
              {isPoseDetectionOn ? "Stop Pose Detection" : "Start Pose Detection"}
            </Button>
          </div>
        )}
      </div>

      {isCameraOn && (
        <div className="mt-4">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user", // Using user camera
            }}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}