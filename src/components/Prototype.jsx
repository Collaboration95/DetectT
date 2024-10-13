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

  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
      });
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

      poseRef.current = pose;
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
      const ctx = canvas.getContext('2d');
      
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


    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score >= minConfidence) {
        ctx.beginPath();
        ctx.arc(ctx.canvas.width - keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });

    // Define connections
    const connections = [
      ['leftShoulder', 'rightShoulder'],
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftWrist'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightWrist'],
      ['leftShoulder', 'leftHip'],
      ['rightShoulder', 'rightHip'],
      ['leftHip', 'rightHip'],
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftAnkle'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightAnkle']
    ];

    // Draw connections
    connections.forEach(([partA, partB]) => {
      const a = pose.keypoints.find(kp => kp.part === partA);
      const b = pose.keypoints.find(kp => kp.part === partB);

      if (a.score >= minConfidence && b.score >= minConfidence) {
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width - a.position.x, a.position.y);
        ctx.lineTo(ctx.canvas.width - b.position.x, b.position.y);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
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
  }, [isCameraOn, isPoseDetectionOn, model, detectionInterval]);

  const handleIntervalChange = (e) => {
    setDetectionInterval(Number(e.target.value));
  };

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
        <>
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
                  facingMode: "user", // Using user camera
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-center mb-2">Mirrored Feed with Skeleton</h2>
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="interval">Detection Interval (ms): </label>
            <input
              type="number"
              id="interval"
              value={detectionInterval}
              onChange={handleIntervalChange}
              min="16"
              max="1000"
              step="16"
            />
          </div>
        </>
      )}
    </div>
  );
}