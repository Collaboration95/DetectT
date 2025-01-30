import React, { useState, useCallback, useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import { Camera } from "lucide-react";
import "@tensorflow/tfjs"; // Ensure TensorFlow.js is imported
import { WebcamFeed, PoseNetModel } from "./ExtractData/index.js";

/**
 * Extracts specific keypoints from a detected pose.
 * Filters for important keypoints such as shoulders, hips, and nose.
 * @param {Object} pose - The detected pose object containing keypoints.
 */

const PrintPosition = (pose, ctx) => {
  const importantPoints = [
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
    "nose",
  ];

  const filteredKeypoints = pose.keypoints.filter((keypoint) =>
    importantPoints.includes(keypoint.name)
  );

  // // hypothetical padding
  const horizontalPadding = 60;
  const verticalPadding = 60;
  const left = horizontalPadding;
  const right = ctx.canvas.width - horizontalPadding;
  const top = verticalPadding;
  const bottom = ctx.canvas.height - verticalPadding;

  const importantPose = {
    keypoints: filteredKeypoints,
    score: pose.score,
  };

  const pointsOutsidePadding = filteredKeypoints.filter((keypoint) => {
    const x = ctx.canvas.width - keypoint.x;
    const y = keypoint.y;
    return x < left || x > right || y < top || y > bottom;
  });

  if (pointsOutsidePadding.length === 0) {
    console.log("Perfect");
  } else {
    console.log(
      "Points outside padding:",
      pointsOutsidePadding.map((kp) => kp.name)
    );
  }

  console.log("Important Pose:", importantPose);
};

export default function ExtractData() {
  const [isCameraOn, setIsCameraOn] = useState(false);

  const [detector, setDetector] = useState(null); // Update state to hold the detector
  // const [detectionInterval, setDetectionInterval] = useState(100); // ms between detections
  const detectionInterval = 100; // ms between detections
  const [overlayMessage, setOverlayMessage] = useState("");
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);
  const poseRef = useRef(null);

  /**
   * Toggles the camera on or off.
   * If the camera is enabled, pose detection is also toggled.
   */
  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
  }, []);

  /**
   * Toggles pose detection on or off.
   */

  /**
   * Detects human poses using the PoseNet model.
   * Ensures that the video feed is ready before running inference.
   */
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
        console.log("inside detectPose", poseRef.current);
        // console.log("Pose detected:", poseRef.current); // enable for debugging
      } catch (error) {
        console.error("Error during pose detection:", error);
      }
    } else {
      console.warn("Detector is not initialized or webcam is not ready.");
    }
  };

  /**
   * Renders frames continuously and processes pose detection at fixed intervals.
   * @param {DOMHighResTimeStamp} time - The current timestamp in milliseconds.
   */
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

  /**
   * Draws the video frame and overlay (if enabled) onto the canvas.
   * Also draws the detected pose skeleton.
   */
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
        console.log("Inside drawFrame", poseRef.current);
        PrintPosition(poseRef.current, ctx);
        drawSkeleton(poseRef.current, ctx);
      }
    }
  };

  /**
   * Draws the detected pose skeleton and keypoints onto the canvas.
   * @param {Object} pose - The detected pose object.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  const drawSkeleton = (pose, ctx) => {
    const minConfidence = 0.6;

    // Draw keypoints
    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score >= minConfidence) {
        ctx.beginPath();
        ctx.arc(ctx.canvas.width - keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    });

    ctx.beginPath();
    ctx.arc(ctx.canvas.width - pose.keypoints[1].x, 10, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();

    const midPointShoulderX =
      (pose.keypoints.find((kp) => kp.name === "left_shoulder").x +
        pose.keypoints.find((kp) => kp.name === "right_shoulder").x) /
      2;
    const midPointShoulderY =
      (pose.keypoints.find((kp) => kp.name === "left_shoulder").y +
        pose.keypoints.find((kp) => kp.name === "right_shoulder").y) /
      2;
    const midPointHipX =
      (pose.keypoints.find((kp) => kp.name === "left_hip").x +
        pose.keypoints.find((kp) => kp.name === "right_hip").x) /
      2;
    const midPointHipY =
      (pose.keypoints.find((kp) => kp.name === "left_hip").y +
        pose.keypoints.find((kp) => kp.name === "right_hip").y) /
      2;
    ctx.beginPath();
    ctx.arc(
      ctx.canvas.width - midPointShoulderX,
      midPointShoulderY,
      5,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ctx.canvas.width - midPointHipX, midPointHipY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
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
    // Draw bounding box with padding
    const horizontalPadding = 50;
    const verticalPadding = 50;
    const left = horizontalPadding;
    const right = ctx.canvas.width - horizontalPadding;
    const top = verticalPadding;
    const bottom = ctx.canvas.height - verticalPadding;

    ctx.beginPath();
    ctx.rect(ctx.canvas.width - right, top, right - left, bottom - top);
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw connections
    connections.forEach(([partA, partB]) => {
      const a = pose.keypoints.find((kp) => kp.name === partA);
      const b = pose.keypoints.find((kp) => kp.name === partB);

      if (a && b && a.score >= minConfidence && b.score >= minConfidence) {
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width - a.x, a.y);
        ctx.lineTo(ctx.canvas.width - b.x, b.y);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    if (isCameraOn) {
      requestRef.current = requestAnimationFrame(renderFrame);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isCameraOn, detector]);

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="font-mono text-3xl text-center mt-2 hover:text-red-900 transition-all duration-200 ease-linear">
        ExtractData
      </h1>
      <div className="mt-4">
        <Button
          variant="default"
          onClick={toggleCamera}
          className="flex items-center"
        >
          <Camera className="mr-2 h-4 w-4" />
          {isCameraOn ? "Stop Data Extraction" : "Launch Data Extraction"}
        </Button>
      </div>

      {isCameraOn && (
        <>
          {/* <CameraOverlay isCameraOn={isCameraOn} /> */}
          Please Be inside the green rectangle at all times
          {overlayMessage}
          <WebcamFeed webcamRef={webcamRef} canvasRef={canvasRef} />
          <PoseNetModel setDetector={setDetector} /> {/* Update this prop */}
        </>
      )}
    </div>
  );
}

const CameraOverlay = ({ isCameraOn }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState("");

  console.log("Inside CameraOverlay", isCameraOn);

  // Function to update the overlay message dynamically
  const showOverlayMessage = (msg) => {
    setOverlayMessage(msg);
    setShowOverlay(true);

    // Hide overlay after 3 seconds
    setTimeout(() => setShowOverlay(false), 3000);
  };

  useEffect(() => {
    if (isCameraOn) {
      console.log("Inside CameraOverlay", isCameraOn);
      const timer = setTimeout(() => {
        showOverlayMessage("Default Message: Adjust your position");
      }, 5000); // Show overlay after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isCameraOn]);

  return (
    <>
      {showOverlay && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "10px",
            fontSize: "18px",
            textAlign: "center",
          }}
        >
          {overlayMessage}
        </div>
      )}
    </>
  );
};
