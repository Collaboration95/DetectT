# Detect-T
**AI-powered pose detection for Fitback project (clothing size recommendation)**

![Setting up DetectT](https://github.com/Collaboration95/DetectT/blob/main/images/posenet-setup.png?raw=true)
  
**Developed as a self contained proof of concept for FitBack (Winner, DesignAI@InspireCon 2025 )**

**Technologies:** JavaScript, TensorFlow.js, MoveNet, PoseNet, Firebase, HTML5 Canvas

## Overview
Detect-T is a web application that uses computer vision and pose detection to verify user presence.The app accesses the user's camera, detects when they're standing in proper T-pose and side-view positions, automatically captures photos, and processes them for size analysis. This proof-of-concept demonstrates how AI can revolutionize online clothing retail by providing personalized fit recommendations.

## Features

- **Real-time Pose Detection**: Uses Google's MoveNet model for accurate human pose estimation with skeleton visualization
- **Automated Photo Capture**: Intelligently detects proper poses (front T-pose and side profile) and captures photos automatically
- **Multi-view Analysis**: Captures both front and side-view images for comprehensive body measurement analysis
- **Interactive UI Feedback**: Provides real-time guidance with silhouette overlays and user feedback messages
- **Responsive Design**: Works across desktop and mobile devices with HTTPS support for camera access

## Skills Demonstrated

- **Computer Vision & AI**: Implemented TensorFlow.js with MoveNet for real-time pose detection and custom Teachable Machine model for pose classification
- **WebRTC & Media APIs**: Utilized getUserMedia API for camera access and Canvas API for real-time video processing and image capture
- **State Machine Design**: Built robust finite state machine for managing complex user interaction flows and pose detection phases
- **Web Workers**: Implemented background processing using Web Workers to handle computationally intensive ML model operations
- **Firebase Integration**: Developed secure cloud storage solution with anonymous authentication for image uploads ( scrapped in final version)
- **Modular Architecture**: Created clean separation of concerns with utility modules for drawing, pose detection, and Firebase operations

## Technical Architecture

- **Frontend**: Vanilla JavaScript with modular ES6 architecture
- **ML Models**: TensorFlow.js 3.x (MoveNet) + TensorFlow.js 1.x (Posenet) running in parallel
- **Real-time Processing**: Canvas-based video rendering with pose skeleton overlay
- **State Management**: Custom finite state machine for user interaction flow

## Lessons Learned
The biggest challenge was managing two different TensorFlow.js versions simultaneously - MoveNet required TFJS 3.x while the custom Teachable Machine model needed TFJS 1.x. I solved this by implementing a Web Worker architecture that isolated the older TensorFlow version, preventing conflicts. This project taught me the importance of dependency management in ML applications and how to architect solutions that can handle multiple model requirements. Additionally, implementing the pose detection state machine revealed the complexity of creating intuitive user experiences for AI-powered applications.