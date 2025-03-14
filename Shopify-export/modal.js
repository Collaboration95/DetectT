var uploadedInfo = false;
let uploadInProgress = false;

// Initialize Firebase using the compat method
firebase.initializeApp(firebaseConfig);
firebase.analytics(); // Optional: Initialize analytics if needed

// Get a reference to Firebase Storage
var storage = firebase.storage();

document.addEventListener("DOMContentLoaded", () => {
  // Your Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDImJ0CQt9cs8xBT-6hgp26xWjpKT75LHI",
    authDomain: "untradox-s.firebaseapp.com",
    projectId: "untradox-s",
    storageBucket: "untradox-s.firebasestorage.app",
    messagingSenderId: "814972006616",
    appId: "1:814972006616:web:cd0e54405b6ed32788a7ad",
    measurementId: "G-5KCHNHFEZL",
  };

  // Initialize Firebase
  // const app = initializeApp(firebaseConfig);
  // const analytics = getAnalytics(app);
  // const storage = getStorage(app);

  const elements = initalizeElements();
  const {
    overlay,
    mainContent,
    openButton,
    screenFit,
    screenProfile,
    tabFitBtn,
    tabProfileBtn,
    slimFit,
    oversizeFit,
    regularFit,
    video,
    canvas,
    startButton,
    userFeedback,
    captureButton,
  } = elements;

  // -- NEW: Append overlay to <body> so it's not nested in a limiting container --
  document.body.appendChild(overlay);

  let stream;
  let detector;
  let isDetecting = false;
  let isReady = false;

  // Load TensorFlow and Pose Detector
  async function initializePoseDetector() {
    await tf.ready();
    await tf.setBackend("webgl");
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      }
    );
    console.log("Pose detector has been initialzed:", detector);
  }

  async function startPoseDetection() {
    if (!detector) await initializePoseDetector();
    isReady = true;
    detectPose();
  }

  const INTERVAL_MS = 100;

  async function detectPose() {
    if (!isDetecting) return;
    if (!isReady || !video || video.readyState < 2) {
      setTimeout(detectPose, INTERVAL_MS);
      return;
    }
    const poses = await detector.estimatePoses(video, {
      flipHorizontal: false,
    });
    drawPose(poses);
    setTimeout(detectPose, INTERVAL_MS);
  }

  const cameraController = {
    isActive: false,
    stream: null,
    async startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        isDetecting = true;
        video.srcObject = stream;
        video.play();
        video.style.display = "block";
        video.onloadeddata = () => {
          console.log("Video loaded, starting pose detection...");
          startPoseDetection();
          captureButton.style.display = "";
          startButton.style.display = "none";
        };
      } catch (error) {
        console.error("Error starting camera:", error);
      }
    },
    deactivateCamera() {
      console.log("Deactivating camera... outer loop");

      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
      isDetecting = false;
      isReady = false;
    },
    DisplayFeedback(message) {
      userFeedback.innerHTML = message;
    },
  };

  setupUI(elements, cameraController);

  function drawPose(poses) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror the canvas
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.restore();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    poses.forEach((pose) => {
      drawSkeleton(pose, ctx);
      analysePose(pose, ctx);
    });
  }

  const analysisState = {
    state: "start", // possible states: "start", "detecting_one", "ready_one", "take_photo", "start_2"
    validSince: null,
    lastFeedback: "", // to store the last feedback message (optional)
  };

  const REQUIRED_TIME = 2000;
  const analysePose = (pose, ctx) => {
    if (analysisState.state === "final_state") {
      DisplayFeedback("Redirecting to a diffrent tab");
      // Simulate clicking the tabFitBtn after 1 second
      setTimeout(() => {
        tabFitBtn.click();
        console.log(
          "Automatically switched to fit tab after detection completed"
        );
      }, 1000);

      return;
    }
    const importantPoints = [
      "nose",
      "left_eye",
      "right_eye",
      "left_ear",
      "right_ear",
      "left_shoulder",
      "right_shoulder",
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
    ];

    const filteredKeypoints = pose.keypoints.filter((keypoint) =>
      importantPoints.includes(keypoint.name)
    );

    // // hypothetical padding
    const horizontalPadding = 10;
    const verticalPadding = 10;
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

    const isInsideFrame = pointsOutsidePadding.length === 0;
    const now = Date.now();

    if (!isInsideFrame && analysisState.state != "start") {
      analysisState.state = "detecting_one";
      analysisState.validSince = null;
      const msg = "Please stand inside the frame";

      if (analysisState.lastFeedback !== msg) {
        DisplayFeedback(msg);
        analysisState.lastFeedback = msg;
      }
      return; // break out of loop for next frame
    }

    if (isInsideFrame) {
      if (!analysisState.validSince) {
        analysisState.validSince = now;
      }

      // Only update state if we have enough consecutive valid frames
      if (now - analysisState.validSince >= REQUIRED_TIME) {
        switch (analysisState.state) {
          case "start":
            analysisState.state = "detecting_one";
            analysisState.validSince = now; // reset timer
            DisplayFeedback("Detecting your pose..."); // Initial detection phase
            break;
          case "detecting_one":
            analysisState.state = "ready_one";
            analysisState.validSince = now; // reset timer
            DisplayFeedback("Good! Hold that pose for a moment...");
            break;
          case "ready_one":
            DisplayFeedback("Taking photo now!");
            if (!uploadedInfo) {
              captureAndSavePhoto(function (err, snapshot) {
                if (err) {
                  console.error("Upload failed:", err);
                  DisplayFeedback("Error: Photo upload failed.");
                } else {
                  console.log("Upload successful:", snapshot);
                  DisplayFeedback("Photo uploaded successfully!");
                  analysisState.state = "final_state";
                }
              });
            }
          case "take_photo":
            analysisState.state = "start_2";
            analysisState.validSince = now; // reset timer
            // DisplayFeedback("Photo taken. Resetting...");

            break;
          case "start_2":
            // Loop back to start for a new capture or continue as needed.
            analysisState.state = "start";
            analysisState.validSince = now; // reset timer
            DisplayFeedback("Process restarted. Please stand still.");
            break;
          case "final_state":
            // Loop back to start for a new capture or continue as needed.
            console.log("proces complete be on your merry way ");
          default:
            // If state is unrecognized, reset.
            analysisState.state = "start";
            analysisState.validSince = now; // reset timer
            DisplayFeedback("Resetting detection. Please stand still.");
            break;
        }
      } else {
        const msg = "Hold that pose for a moment...";
        if (analysisState.lastFeedback !== msg) {
          DisplayFeedback(msg);
          analysisState.lastFeedback = msg;
        }
      }
    } else {
      if (analysisState.state === "start") {
        const msg = "Please stand to the centre of the frame ";
        if (analysisState.lastFeedback !== msg) {
          DisplayFeedback(msg);
          analysisState.lastFeedback = msg;
        }
      }
    }
  };

  function captureAndSavePhoto(callback) {
    // Create a temporary canvas to capture the video frame
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    // Draw the current video frame
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Convert the canvas to a JPEG data URL
    const dataUrl = tempCanvas.toDataURL("image/jpeg");

    // Create a timestamped filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const filename = `photo_${timestamp}.jpg`;

    // Call uploadToFirebase and pass a callback to handle both success and failure.
    uploadToFirebase(filename, dataUrl, function (err, snapshot) {
      if (callback) {
        callback(err, snapshot);
      }
    });

    console.log("Photo captured:", filename);
  }

  function uploadToFirebase(filename, dataUrl, callback) {
    if (uploadedInfo) {
      // Optionally, you could call the callback here if needed.
      return;
    }
    if (uploadInProgress) {
      console.log("Upload already in progress; skipping duplicate upload.");
      return;
    }

    // Set the flag immediately to prevent further uploads.
    uploadInProgress = true;
    const storageRef = storage.ref("photos/" + filename);

    storageRef
      .putString(dataUrl, "data_url")
      .then(function (snapshot) {
        uploadedInfo = true;
        console.log("Uploaded photo to Firebase Storage:", snapshot);
        // Invoke the callback with no error and the snapshot
        callback(null, snapshot);
      })
      .catch(function (error) {
        console.error("Error uploading photo to Firebase Storage:", error);
        uploadInProgress = false;
        // Invoke the callback with the error object
        callback(error);
      });
  }

  // function captureAndSavePhoto() {
  //   // Create a temporary canvas to capture the video frame
  //   const tempCanvas = document.createElement("canvas");
  //   tempCanvas.width = video.videoWidth;
  //   tempCanvas.height = video.videoHeight;

  //   // Get the context and draw the current video frame
  //   const ctx = tempCanvas.getContext("2d");

  //   // If you want the normal (non-mirrored) image:
  //   ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

  //   // Convert the canvas to a JPEG data URL
  //   const dataUrl = tempCanvas.toDataURL("image/jpeg");

  //   // Create a timestamped filename
  //   const now = new Date();
  //   const timestamp = now.toISOString().replace(/[:.]/g, "-");
  //   const filename = `photo_${timestamp}.jpg`;

  //   // Option 1: Save to localStorage
  //   console.log("Upload to firebase is called here");
  //   uploadToFirebase(filename, dataUrl);

  //   // Option 2: Prompt download
  //   // downloadImage(dataUrl, filename);

  //   console.log("Photo captured:", filename);
  //   DisplayFeedback("Photo saved! You can now close this window.");
  // }
  // function uploadToFirebase(filename, dataUrl) {
  //   if (uploadedInfo) {
  //     return;
  //   }
  //   if (uploadInProgress) {
  //     console.log("Upload already in progress; skipping duplicate upload.");
  //     return;
  //   }
  //   // Set the flag immediately to prevent further uploads.
  //   uploadInProgress = true;
  //   // // Create a reference in Firebase Storage (e.g., in a "photos" folder)
  //   var storageRef = storage.ref("photos/" + filename);

  //   // Use putString with the data_url format to upload the image
  //   storageRef
  //     .putString(dataUrl, "data_url")
  //     .then(function (snapshot) {
  //       uploadedInfo = true;
  //       console.log("Uploaded photo to Firebase Storage:", snapshot);
  //     })
  //     .catch(function (error) {
  //       console.error("Error uploading photo to Firebase Storage:", error);
  //       uploadInProgress = false;
  //     });
  // }

  // function saveToLocalStorage(filename, dataUrl) {
  //   // Store image data in localStorage
  //   try {
  //     // Check available storage
  //     const remainingSpace = 5 * 1024 * 1024; // Estimate 5MB remaining (you may need to check actual available space)

  //     // Clean up old photos if needed
  //     const storedPhotos = Object.keys(localStorage).filter((key) =>
  //       key.startsWith("photo_")
  //     );
  //     if (storedPhotos.length > 10 || dataUrl.length > remainingSpace) {
  //       // Remove oldest photos if we have more than 10 or if space is limited
  //       storedPhotos
  //         .sort()
  //         .slice(0, storedPhotos.length - 9)
  //         .forEach((key) => {
  //           localStorage.removeItem(key);
  //         });
  //     }

  //     // Store the new photo
  //     localStorage.setItem(filename, dataUrl);
  //     console.log("Photo saved to localStorage:", filename);
  //   } catch (e) {
  //     console.error("Error saving to localStorage:", e);
  //     // If localStorage fails, fall back to download
  //     downloadImage(dataUrl, filename);
  //   }
  // }
  const DisplayFeedback = (message) => {
    userFeedback.innerHTML = message;
  };

  const drawSkeleton = (pose, ctx) => {
    const minConfidence = 0.6;

    // Helper function to flip and scale coordinates
    const transformPoint = (x, y) => {
      return {
        x: (ctx.canvas.width - x) * (ctx.canvas.width / video.videoWidth),
        y: y * (ctx.canvas.height / video.videoHeight),
      };
    };

    const getMidpoint = (a, b) => {
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      };
    };

    // Draw keypoints with transformation applied
    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score >= minConfidence) {
        const { x, y } = transformPoint(keypoint.x, keypoint.y);
        drawPoint(ctx, x, y, 5, "red");
      }
    });

    // Helper to find a specific keypoint
    const getKeypoint = (name) => {
      return pose.keypoints.find((kp) => kp.name === name);
    };

    const leftShoulder = getKeypoint("left_shoulder");
    const rightShoulder = getKeypoint("right_shoulder");
    const leftHip = getKeypoint("left_hip");
    const rightHip = getKeypoint("right_hip");

    if (leftShoulder && rightShoulder) {
      const leftShoulderT = transformPoint(leftShoulder.x, leftShoulder.y);
      const rightShoulderT = transformPoint(rightShoulder.x, rightShoulder.y);
      const midPointShoulder = getMidpoint(leftShoulderT, rightShoulderT);
      drawPoint(ctx, midPointShoulder.x, midPointShoulder.y, 5, "green");

      if (leftHip && rightHip) {
        const leftHipT = transformPoint(leftHip.x, leftHip.y);
        const rightHipT = transformPoint(rightHip.x, rightHip.y);
        const midPointHip = getMidpoint(leftHipT, rightHipT);

        drawPoint(ctx, midPointHip.x, midPointHip.y, 5, "green");

        // Connect the midpoints of shoulders and hips
        connectPoints(
          ctx,
          midPointShoulder.x,
          midPointShoulder.y,
          midPointHip.x,
          midPointHip.y,
          "green",
          2
        );
      } else {
        console.log("hips not detected");
      }
    } else {
      console.log("shoulders not detected");
    }

    // Define connections to draw between keypoints
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
    // decide on this later

    // const horizontalPadding = 50;
    // const verticalPadding = 50;
    // const leftBound = horizontalPadding;
    // const rightBound = ctx.canvas.width - horizontalPadding;
    // const topBound = verticalPadding;
    // const bottomBound = ctx.canvas.height - verticalPadding;

    // ctx.beginPath();
    // // Here we mirror the x-coordinate of the right bound.
    // ctx.rect(
    //   ctx.canvas.width - rightBound,
    //   topBound,
    //   rightBound - leftBound,
    //   bottomBound - topBound
    // );
    // ctx.strokeStyle = "green";
    // ctx.lineWidth = 2;
    // ctx.stroke();

    // Draw connections between keypoints with transformation applied
    connections.forEach(([partA, partB]) => {
      const a = getKeypoint(partA);
      const b = getKeypoint(partB);
      if (a && b && a.score >= minConfidence && b.score >= minConfidence) {
        const aT = transformPoint(a.x, a.y);
        const bT = transformPoint(b.x, b.y);
        connectPoints(ctx, aT.x, aT.y, bT.x, bT.y, "blue", 2);
      }
    });
  };

  captureButton.addEventListener("click", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const photoData = canvas.toDataURL("image/jpeg");
    console.log("Captured photo:", photoData);
  });

  window.addEventListener("beforeunload", () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
  });
});

function initalizeElements() {
  const overlay = document.getElementById("modal-overlay");
  const mainContent = document.getElementById("modal-content");
  const openButton = document.getElementById("open-modal");
  const tabFitBtn = document.getElementById("tab-fit");
  const tabProfileBtn = document.getElementById("tab-profile");

  // Grab screens
  const screenFit = document.getElementById("screen-fit");
  const screenProfile = document.getElementById("screen-profile");

  const slimFit = document.getElementById("fit-slim");
  const regularFit = document.getElementById("fit-regular");
  const oversizeFit = document.getElementById("fit-oversize");
  const video = document.getElementById("camera-preview");
  const canvas = document.getElementById("camera-output");
  const startButton = document.getElementById("start-camera");
  const userFeedback = document.getElementById("user-feedback");
  const captureButton = document.getElementById("capture-photo");
  return {
    overlay,
    mainContent,
    openButton,
    screenFit,
    screenProfile,
    tabFitBtn,
    tabProfileBtn,
    slimFit,
    oversizeFit,
    regularFit,
    video,
    canvas,
    startButton,
    userFeedback,
    captureButton,
  };
}

function setupUI(
  {
    overlay,
    openButton,
    mainContent,
    tabFitBtn,
    slimFit,
    regularFit,
    oversizeFit,
    tabProfileBtn,
    screenFit,
    screenProfile,
    video,
    canvas,
  },
  cameraController
) {
  // 4. Event handlers: open/close the modal
  openButton.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    overlay.classList.add("visible");
    // mainContent.classList.remove("hidden");
    // mainContent.classList.add("visible");
  });

  // Close modal if user clicks *outside* modal-content
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.classList.remove("visible");
      overlay.classList.add("hidden");
      console.log("Need to remove camera here as well");
      // Need to end camera here
      cameraController.isActive = false;
      cameraController.deactivateCamera();
      if (uploadedInfo) {
        DisplayFeedback("Nothing happening here ");
      }
      // mainContent.classList.remove("visible");
      // mainContent.classList.add("hidden");
    }
  });

  // Tab 1: My Fit
  tabFitBtn.addEventListener("click", () => {
    // Switch active tab button
    tabFitBtn.classList.add("active");
    tabProfileBtn.classList.remove("active");

    // Switch active screen
    screenFit.classList.add("active");
    screenProfile.classList.remove("active");
    // Need to end camera
    cameraController.isActive = false;
    cameraController.deactivateCamera();
    if (uploadedInfo) {
      DisplayFeedback("Nothing happening here ");
    }
  });

  //My Fit size recommend
  slimFit.addEventListener("click", () => {
    slimFit.classList.add("active");
    regularFit.classList.remove("active");
    oversizeFit.classList.remove("active");
  });
  regularFit.addEventListener("click", () => {
    slimFit.classList.remove("active");
    regularFit.classList.add("active");
    oversizeFit.classList.remove("active");
  });
  oversizeFit.addEventListener("click", () => {
    slimFit.classList.remove("active");
    regularFit.classList.remove("active");
    oversizeFit.classList.add("active");
  });

  // Tab 2: My Profile
  tabProfileBtn.addEventListener("click", () => {
    tabProfileBtn.classList.add("active");
    tabFitBtn.classList.remove("active");

    screenProfile.classList.add("active");
    screenFit.classList.remove("active");
    // Make sure the camera and canvas are visible
    video.style.display = "block";
    canvas.style.display = "block";
    // Activate the camera
    console.log("Need to start camera ");

    cameraController.isActive = true;
    if (!cameraController.stream) {
      cameraController.startCamera();
    }
  });
}

// helper functions to draw stuff

const drawPoint = (ctx, x, y, r, color) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
};

const connectPoints = (ctx, aX, aY, bX, bY, linecolor, lineWidth) => {
  ctx.beginPath();
  ctx.moveTo(aX, aY);
  ctx.lineTo(bX, bY);
  ctx.strokeStyle = linecolor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
};

function drawFakeSkeleton(ctx) {
  const FAKE_POSE = [
    {
      y: 100.76992034912108,
      x: 384.80335235595703,
      name: "left_shoulder",
    },
    {
      y: 102.15702056884766,
      x: 245.43790817260742,
      name: "right_shoulder",
    },
    {
      y: 184.5937919616699,
      x: 441.77051544189453,
      name: "left_elbow",
    },
    {
      y: 187.73353576660153,
      x: 196.80011749267578,
      name: "right_elbow",
    },
    {
      y: 262.1822738647461,
      x: 522.043342590332,
      name: "left_wrist",
    },
    {
      y: 259.95513916015625,
      x: 119.61420059204102,
      name: "right_wrist",
    },
    {
      y: 306.4754867553711,
      x: 355.8803176879883,
      name: "left_hip",
    },
    {
      y: 304.19166564941406,
      x: 272.9588317871094,
      name: "right_hip",
    },
    {
      y: 472.6880264282226,
      x: 358.6654281616211,
      name: "left_knee",
    },
    {
      y: 461.5346145629882,
      x: 280.98581314086914,
      name: "right_knee",
    },
    {
      y: 445.2193832397461,
      x: 334.33292388916016,
      name: "left_ankle",
    },
    {
      y: 444.05029296875,
      x: 297.999210357666,
      name: "right_ankle",
    },
  ];

  const FAKE_CONNECTIONS = [
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    // etc., if you want more connections
  ];

  const transformPoint = (x, y) => {
    return {
      x: (ctx.canvas.width - x) * (ctx.canvas.width / video.videoWidth),
      y: y * (ctx.canvas.height / video.videoHeight),
    };
  };

  // Draw each keypoint
  FAKE_POSE.forEach((keypoint) => {
    // Transform the x,y if you are mirroring/flipping
    const { x, y } = transformPoint(keypoint.x, keypoint.y);
    drawPoint(ctx, x, y, 5, "blue");
  });

  // Helper to find a keypoint by name in FAKE_POSE
  function getFakeKeypoint(name) {
    return FAKE_POSE.find((kp) => kp.name === name);
  }

  // Draw lines between connected parts
  FAKE_CONNECTIONS.forEach(([partA, partB]) => {
    const a = getFakeKeypoint(partA);
    const b = getFakeKeypoint(partB);
    if (a && b) {
      const aT = transformPoint(a.x, a.y);
      const bT = transformPoint(b.x, b.y);
      connectPoints(ctx, aT.x, aT.y, bT.x, bT.y, "blue", 2);
    }
  });
}
