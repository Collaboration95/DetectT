
import React, { useState, useCallback, useRef, useEffect } from "react";
import "@tensorflow/tfjs"; // Ensure TensorFlow.js is imported
import {
  WebcamFeed,
  CameraControls,
  SkeletonDrawing,
  PoseNetModel, 
} from "./Prototype/index.js";


const ExtractPosition = (pose) => {

  const importantPoints =['left_shoudler', 'right_shoulder', 'left_hip', 'right_hip',"nose"]
  const filteredKeypoints = pose.keypoints.filter((keypoint) =>
    importantPoints.includes(keypoint.name)
  );

  const importantPose = {
    keypoints: filteredKeypoints,
    score: pose.score,
  };
  console.log("extracted pose info is " , importantPose)

}

export default function Prototype() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isPoseDetectionOn, setIsPoseDetectionOn] = useState(false);
  const [detector, setDetector] = useState(null); // Update state to hold the detector
  const [detectionInterval, setDetectionInterval] = useState(100); // ms between detections
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);
  const poseRef = useRef(null);

  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
  }, []);

  const togglePoseDetection = useCallback(() => {
    setIsPoseDetectionOn((prev) => !prev);
  }, []);

  const detectPose = async () => {
    if (
      detector &&
      webcamRef.current &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
  
      // Log video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
  
      // Check if video dimensions are valid
      if (videoWidth === 0 || videoHeight === 0) {
        console.warn("Video dimensions are zero. Skipping pose detection.");
        return; // Exit early if dimensions are not valid
      }
  
      // Detect pose from the video element
      try {
        const poses = await detector.estimatePoses(video, {
          flipHorizontal: false,
        });
        poseRef.current = poses.length > 0 ? poses[0] : null;
        // console.log("Pose detected:", poseRef.current); // enable for debugging 

        ExtractPosition(poseRef.current);

      } catch (error) {x
        console.error("Error during pose detection:", error);
      }
    } else {
      console.warn("Detector is not initialized or webcam is not ready.");
    }
  };
  
  

  const renderFrame = (time) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;

      if (deltaTime > detectionInterval) {
        detectPose();
        previousTimeRef.current = time;
      }
    } else {
      previousTimeRef.current = time;
    }

    drawFrame();

    requestRef.current = requestAnimationFrame(renderFrame);
  };


  const drawFrame = () => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4 &&
      canvasRef.current
    ) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
  
      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
  
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Draw the mirrored video feed
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
  
      // Draw the skeleton if pose data is available
      if (poseRef.current) {
        drawSkeleton(poseRef.current, ctx);
      }
    }
  };
  
  const drawSkeleton = (pose, ctx) => {
      const minConfidence = 0.6;
    
    // Draw keypoints
    // pose.keypoints.forEach((keypoint) => {
    //   if (keypoint.score >= minConfidence) {
    //     ctx.beginPath();
    //     ctx.arc(
    //       ctx.canvas.width - keypoint.x,
    //       keypoint.y,
    //       5,
    //       0,
    //       2 * Math.PI,
    //     );
    //     ctx.fillStyle = "red";
    //     ctx.fill();
    //   }
    // });

    // ctx.beginPath();
    // ctx.arc(ctx.canvas.width-pose.keypoints[1].x, 10, 5, 0, 2 * Math.PI);
    // ctx.fillStyle = "red"
    // ctx.fill();

    const midPointShoulderX =(pose.keypoints.find((kp) => kp.name === "left_shoulder").x + pose.keypoints.find((kp) => kp.name === "right_shoulder").x) / 2
    const midPointShoulderY =(pose.keypoints.find((kp) => kp.name === "left_shoulder").y + pose.keypoints.find((kp) => kp.name === "right_shoulder").y) / 2
    const midPointHipX =(pose.keypoints.find((kp) => kp.name === "left_hip").x + pose.keypoints.find((kp) => kp.name === "right_hip").x) / 2
    const midPointHipY =(pose.keypoints.find((kp) => kp.name === "left_hip").y + pose.keypoints.find((kp) => kp.name === "right_hip").y) / 2
    ctx.beginPath();
    ctx.arc(ctx.canvas.width-midPointShoulderX, midPointShoulderY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "green"
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ctx.canvas.width-midPointHipX, midPointHipY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "blue"
    ctx.fill();

    // Connect the midpoints of the shoulders and hips
    ctx.beginPath();
    ctx.moveTo(ctx.canvas.width - midPointShoulderX, midPointShoulderY);
    ctx.lineTo(ctx.canvas.width - midPointHipX, midPointHipY);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Define connections
    const connections = [
      ["left_shoulder", "right_shoulder"],
      ["left_shoulder", "left_elbow"],
      ["left_elbow", "left_wrist"],
      ["right_shoulder", "right_elbow"],
      ["right_elbow", "right_wrist"],
      ["left_shoulder", "left_hip"],
      ["right_shoulder", "right_hip"],
      ["left_hip", "right_hip"],
      ["left_hip", "left_knee"],
      ["left_knee", "left_ankle"],
      ["right_hip", "right_knee"],
      ["right_knee", "right_ankle"],
    ];
  
    // Draw connections
    // connections.forEach(([partA, partB]) => {
    //   const a = pose.keypoints.find((kp) => kp.name === partA); // Change 'part' to 'name'
    //   const b = pose.keypoints.find((kp) => kp.name === partB); // Change 'part' to 'name'
  
    //   if (a && b && a.score >= minConfidence && b.score >= minConfidence) {
    //     ctx.beginPath();
    //     ctx.moveTo(ctx.canvas.width - a.x, a.y);
    //     ctx.lineTo(ctx.canvas.width - b.x, b.y);
    //     ctx.strokeStyle = "blue";
    //     ctx.lineWidth = 2;
    //     ctx.stroke();
    //   }
    // });
  };



  useEffect(() => {
    if (isCameraOn && isPoseDetectionOn) {
      requestRef.current = requestAnimationFrame(renderFrame);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isCameraOn, isPoseDetectionOn, detector, detectionInterval]);

  const handleIntervalChange = (e) => {
    setDetectionInterval(Number(e.target.value));
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="font-mono text-3xl text-center mt-2 hover:text-red-900 transition-all duration-200 ease-linear">
        Prototype
      </h1>

      <CameraControls
        isCameraOn={isCameraOn}
        toggleCamera={toggleCamera}
        isPoseDetectionOn={isPoseDetectionOn}
        togglePoseDetection={togglePoseDetection}
      />

      {isCameraOn && (
        <>
          <WebcamFeed webcamRef={webcamRef} canvasRef={canvasRef} />
          <PoseNetModel setDetector={setDetector} /> {/* Update this prop */}
          <SkeletonDrawing
            detectionInterval={detectionInterval}
            handleIntervalChange={handleIntervalChange}
          />
        </>
      )}
    </div>
  );
}

