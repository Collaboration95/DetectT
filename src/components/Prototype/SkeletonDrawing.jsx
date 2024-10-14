// import React, { useRef, useEffect } from 'react';

//  const SkeletonDrawing = ({ model, webcamRef, canvasRef, poseRef, detectionInterval }) => {
//   const requestRef = useRef(null);
//   const previousTimeRef = useRef(null);

//   const detectPose = async () => {
//     if (model && webcamRef.current && webcamRef.current.video.readyState === 4) {
//       const video = webcamRef.current.video;
//       const pose = await model.estimateSinglePose(video, { flipHorizontal: false });
//       poseRef.current = pose;
//     }
//   };

//   const drawFrame = () => {
//     if (webcamRef.current && webcamRef.current.video.readyState === 4 && canvasRef.current) {
//       const video = webcamRef.current.video;
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext('2d');
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.save();
//       ctx.scale(-1, 1);
//       ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
//       ctx.restore();
//     }
//   };

//   const renderFrame = (time) => {
//     if (previousTimeRef.current != undefined) {
//       const deltaTime = time - previousTimeRef.current;
//       if (deltaTime > detectionInterval) {
//         detectPose();
//         previousTimeRef.current = time;
//       }
//     } else {
//       previousTimeRef.current = time;
//     }
//     drawFrame();
//     requestRef.current = requestAnimationFrame(renderFrame);
//   };

//   useEffect(() => {
//     if (model) {
//       requestRef.current = requestAnimationFrame(renderFrame);
//     }
//     return () => {
//       cancelAnimationFrame(requestRef.current);
//     };
//   }, [model, detectionInterval]);

//   return null;
// };

// export default SkeletonDrawing;

import { useRef, useEffect } from 'react';

const SkeletonDrawing = ({ model, webcamRef, canvasRef, poseRef, detectionInterval, isPoseDetectionOn }) => {
  const previousTimeRef = useRef(null);
  const requestRef = useRef(null);

  const detectPose = async () => {
    if (model && webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;

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
    if (webcamRef.current && webcamRef.current.video.readyState === 4 && canvasRef.current) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(-1, 1); // Mirror the video feed
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      if (poseRef.current) {
        drawSkeleton(poseRef.current, ctx);
      }
    }
  };

  const drawSkeleton = (pose, ctx) => {
    const minConfidence = 0.6;
    const connections = [
      // Define keypoint connections here as before
    ];

    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score >= minConfidence) {
        ctx.beginPath();
        ctx.arc(ctx.canvas.width - keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });

    connections.forEach(([partA, partB]) => {
      const a = pose.keypoints.find((kp) => kp.part === partA);
      const b = pose.keypoints.find((kp) => kp.part === partB);

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

  // useEffect to handle pose detection toggling
  useEffect(() => {
    if (isPoseDetectionOn && model && webcamRef.current && canvasRef.current) {
      // Start rendering and detecting poses if pose detection is on
      requestRef.current = requestAnimationFrame(renderFrame);
    } else if (!isPoseDetectionOn && requestRef.current) {
      // Stop pose detection if turned off
      cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPoseDetectionOn, model, detectionInterval]);

  return null; // Just renders the animation loop and detection
};

export default SkeletonDrawing;
