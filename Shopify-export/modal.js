import { drawSkeleton } from "./utils/drawUtils.js";
import { initFirebase, uploadToFirebase } from "./utils/firebaseUtils.js";
import { initializePoseDetector, estimatePoses } from "./utils/poseDetector.js";
import { loadModel, classifyFrame } from "./utils/workerManager.js";

// const tf1Worker = new Worker("tf1-worker.js");
// tf1Worker.postMessage({ command: "version" });

// tf1Worker.onmessage = (e) => {
//   const data = e.data;
//   if (data.type === "version") {
//     console.log("TF1 worker version:", data.version);
//   } else if (data.type === "model_loaded") {
//     if (data.success) {
//       console.log("Teachable Machine model loaded in worker");
//     } else {
//       console.error("Failed to load model in worker:", data.error);
//     }
//   } else if (data.type === "classification") {
//     // The worker has returned a classification
//     if (data.error) {
//       console.error("Worker classification error:", data.error);
//       workerClassificationResolve(false); // pass a "failed" to the awaiting Promise
//     } else {
//       // resolve the awaiting Promise with the classification
//       workerClassificationResolve({
//         className: data.bestClass,
//         probability: data.probability,
//       });
//     }
//   }
// };

// let workerClassificationResolve = null;

var uploadedInfo = false;

// Initialize Firebase using the compat method
initFirebase(firebaseConfig);

document.addEventListener("DOMContentLoaded", async () => {
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

  loadModel(TM_URL + "model.json", TM_URL + "metadata.json");
  // init the model
  // tf1Worker.postMessage({
  //   command: "LOAD_MODEL",
  //   data: {
  //     modelURL: TM_URL + "model.json",
  //     metadataURL: TM_URL + "metadata.json",
  //   },
  // });

  async function startPoseDetection() {
    if (!detector) {
      detector = await initializePoseDetector();
    }
    isReady = true;
    // Once the detector is ready, start the detection loop.
    requestAnimationFrame(detectPose);
  }

  const THROTTLE_DELAY = 120; // milliseconds, adjust as needed
  let lastTime = 0;

  async function detectPose(timestamp) {
    if (!isDetecting) return;

    // Wait for video readiness
    if (!isReady || !video || video.readyState < 2) {
      requestAnimationFrame(detectPose);
      return;
    }

    // Throttle by checking elapsed time
    if (timestamp - lastTime < THROTTLE_DELAY) {
      requestAnimationFrame(detectPose);
      return;
    }

    lastTime = timestamp;

    try {
      const poses = await estimatePoses(detector, video);
      drawPose(poses);
    } catch (error) {
      console.error("Error in pose estimation:", error);
    }

    requestAnimationFrame(detectPose);
  }

  window.addEventListener("resize", () => {
    const video = cameraController.getVideoElement();
    const silhouette = document.getElementById("expected-silhouette");
    const vidHeight = video.offsetHeight;
    silhouette.style.height = vidHeight * 0.95 + "px";
  });

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

          // TODO : convert this to a function to initialize the silhoutte
          const silhouette = document.getElementById("expected-silhouette");
          console.log("silhouette", video.offsetWidth, video.offsetHeight);
          const vidHeight = video.offsetHeight;
          silhouette.style.height = vidHeight * 0.95 + "px";
          startPoseDetection();
          captureButton.style.display = "";
          startButton.style.display = "none";
          // console.log(video.videoWidth, video.videoHeight);
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
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
    getVideoElement() {
      return video;
    },
  };

  setupUI(elements, cameraController);

  function drawPose(poses) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    // Mirror the canvas
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // My understanding is that if new canvas is less than image size ,we can see the past points
    // to avoid thsis we clear the image
    // causes some weird issues
    // ctx.clearRect(0, 0, canvas.width, canvas.height); // ← Problem is here!

    ctx.restore();
    video.display = "none";
    poses.forEach((pose) => {
      drawSkeleton(pose, ctx, video);
      analysePose(pose, ctx);
    });
  }

  const analysisState = {
    state: "start", // possible states: "start", "detecting_one", "ready_one", "take_photo", "start_2"
    validSince: null,
    lastFeedback: "", // to store the last feedback message (optional)
    imageBlobArray: [],
    photosTaken: 0,
    uploadInProgress: false,
  };

  const REQUIRED_TIME = 3000;

  let isClassifying = false;

  const analysePose = async (pose, ctx) => {
    //dev version
    const importantPoints = [
      "left_shoulder",
      "right_shoulder",
      // "left_elbow",
      // "right_elbow",
      // "left_wrist",
      // "right_wrist",
      // "left_hip",
      // "right_hip",
    ];
    // const importantPoints = [
    //   "nose",
    //   "left_eye",
    //   "right_eye",
    //   "left_ear",
    //   "right_ear",
    //   "left_shoulder",
    //   "right_shoulder",
    //   "left_elbow",
    //   "right_elbow",
    //   "left_wrist",
    //   "right_wrist",
    //   "left_hip",
    //   "right_hip",
    //   "left_knee",
    //   "right_knee",
    //   "left_ankle",
    //   "right_ankle",
    // ];

    const filteredKeypoints = pose.keypoints.filter((keypoint) =>
      importantPoints.includes(keypoint.name)
    );

    // // hypothetical padding
    const horizontalPadding = 5;
    const verticalPadding = 5;
    const left = horizontalPadding;
    const right = ctx.canvas.width - horizontalPadding;
    const top = verticalPadding;
    const bottom = ctx.canvas.height - verticalPadding;

    const pointsOutsidePadding = filteredKeypoints.filter((keypoint) => {
      const x = ctx.canvas.width - keypoint.x;
      const y = keypoint.y;
      return x < left || x > right || y < top || y > bottom;
    });

    const isInsideFrame = pointsOutsidePadding.length === 0;
    const now = Date.now();

    // pre loop check 2 : Photo taking process completed but need to upload the photo to firebase
    if (analysisState.state === "upload_photo") {
      // Need to upload photos to firebase , no need to traverse through FSM
      DisplayFeedback("Uploading photos to firebase");

      updateSilhouette("disable");

      uploadToFirebase(analysisState, (err, results) => {
        if (err) {
          console.error("Upload failed:", err);
        } else {
          console.log("Upload completed, download URLs:", results);
          analysisState.state = "final_state";
          DisplayFeedback("Photo upload completed successfully  ");
        }
      });

      return;
    } else if (analysisState.state === "final_state") {
      DisplayFeedback("Measurement Process has been completed");
      // Simulate clicking the tabFitBtn after 1 second
      // need to modify this to make changes to the UI before switching over
      setTimeout(() => {
        tabFitBtn.click();
        console.log(
          "Automatically switched to fit tab after detection completed"
        );
      }, 1000);

      return;
    }

    // IF user out of frame before photo taking process completed
    if (
      !isInsideFrame &&
      analysisState.state != "start" &&
      analysisState.state != "start_2"
    ) {
      if (analysisState.imageBlobArray.length == 0) {
        analysisState.state = "detecting_one";
      } else if (analysisState.imageBlobArray.length == 1) {
        analysisState.state = "detecting_two";
      } else {
        console.log(
          "Edge case detected, occurs when user outside of frame after taking photos"
        );
      }

      analysisState.validSince = null;
      const msg = "Please stand inside the frame";

      if (analysisState.lastFeedback !== msg) {
        DisplayFeedback(msg);
        analysisState.lastFeedback = msg;
      }
      return; // break out of loop for next frame
    }

    // after loading the detector model , we display the silhouette
    updateSilhouette("start");

    if (isInsideFrame) {
      if (!analysisState.validSince) {
        analysisState.validSince = now;
      }

      // Only update state if we have enough consecutive valid frames
      if (now - analysisState.validSince >= REQUIRED_TIME) {
        switch (analysisState.state) {
          case "start":
            console.log("Transitioning to detecting_one ");
            analysisState.state = "detecting_one";
            analysisState.validSince = now; // reset timer
            updateSilhouette("start");
            DisplayFeedback("Detecting your pose..."); // Initial detection phase
            break;
          // Outside the loop, define a flag

          case "detecting_one":
            if (isClassifying) {
              // Skip this iteration if a classification is already running
              break;
            }
            isClassifying = true;

            // DisplayFeedback("Pose Detection in Progress, Remain Still");
            const result = await collapsePose(canvas);

            if (
              result.poseName === "Front-view" &&
              result.poseConfidence > 0.7
            ) {
              DisplayFeedback("Pose Detected , Taking photo stand still");
              analysisState.state = "ready_one";
              analysisState.validSince = now; // reset timer
            } else {
              DisplayFeedback("Please match the silhouette with your body");
              console.log("Result is ", result.poseName);
              // Optionally, you could set isClassifying = false here if you want to allow retry immediately
              isClassifying = false;
              return;
            }

            isClassifying = false;
            break;

          case "ready_one":
            DisplayFeedback("Taking photo now!");

            returnPhotoRef("front", function (err, result) {
              if (err) {
                console.error("Capture Photo method failed with", err);
                // DisplayFeedback("Error: Photo upload failed.");
                // TODO : Need to reset the loop here
              } else {
                console.log("Saved image to local disk:", result);
                DisplayFeedback("Moving to Next Pose");
                analysisState.imageBlobArray.push(result);
                analysisState.state = "start_2";
                analysisState.validSince = now; // reset timer
              }
            });
            break;
          case "start_2":
            // Loop back to start for a new capture or continue as needed.
            analysisState.state = "detecting_two";
            analysisState.validSince = now; // reset timer
            DisplayFeedback("Please rotate 90 degrees to the right");
            updateSilhouette("start_2");
            break;
          case "detecting_two":
            if (isClassifying) {
              // Skip this iteration if a classification is already running
              break;
            }
            isClassifying = true;

            // DisplayFeedback("Pose Detection in Progress, Remain Still");
            const result2 = await collapsePose(canvas);

            if (
              result2.poseName === "side-view" &&
              result2.poseConfidence > 0.7
            ) {
              DisplayFeedback("Pose Detected , Taking photo stand still");
              analysisState.state = "ready_two";
              analysisState.validSince = now; // reset timer
            } else {
              DisplayFeedback("Please match the silhouette with your body");
              // Optionally, you could set isClassifying = false here if you want to allow retry immediately
              isClassifying = false;
              return;
            }

            isClassifying = false;
            break;

          case "ready_two":
            DisplayFeedback("Taking photo now!");
            // find a way to rename front and back for this function to name stuff properly
            returnPhotoRef("side", function (err, result) {
              if (err) {
                console.error("Capture Photo method failed with", err);
                // DisplayFeedback("Error: Photo upload failed.");
              } else {
                console.log("Saved image to local disk:", result);
                DisplayFeedback("Photo uploaded successfully!");

                analysisState.imageBlobArray.push(result);
                analysisState.validSince = now; // reset timer
                analysisState.state = "upload_photo";
              }
            });
            break;
          case "final_state":
            DisplayFeedback("Photo Taking process has been completed");
            analysisState.state = "dummy_state";
            break;
          case "dummy_state":
            console.log("No transition needed");
            break;

          default:
            // If state is unrecognized, reset.
            analysisState.state = "start";
            analysisState.validSince = now; // reset timer
            DisplayFeedback("Resetting detection. Please stand still.");
            break;
        }
      } else {
        // console.log(
        //   "Not enough valid frames yet" + now - analysisState.validSince
        // );
        const msg = "Detection in Progress , Remain Still";
        if (analysisState.lastFeedback !== msg) {
          DisplayFeedback(msg);
          analysisState.lastFeedback = msg;
        }
      }
    } else {
      if (analysisState.state === "start") {
        const msg = "Please match the silhoutte with your body";
        if (analysisState.lastFeedback !== msg) {
          DisplayFeedback(msg);
          analysisState.lastFeedback = msg;
        }
      }
    }
  };

  function returnPhotoRef(url_modifier, callback) {
    console.log("REturn photo ref being called");
    // {filename,blob}
    console.log("Capture photo being called");

    // Create a temporary canvas to capture the video frame
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    // Draw the current video frame
    const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Create a timestamped filename (for logging purposes only)
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const filename = `${url_modifier}_${timestamp}.jpg`;

    // Convert the canvas to a Blob (high quality)
    tempCanvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Failed to capture image as Blob.");
          if (callback) callback(new Error("Failed to create Blob"), null);
          return;
        }

        console.log("Photo captured:", filename);

        // Call the callback with the Blob instead of a base64 string
        if (callback) {
          callback(null, { filename, blob });
        }
      },
      "image/jpeg",
      0.99
    ); // High-quality JPEG (95%)
  }

  captureButton.addEventListener("click", () => {
    // depreciated method
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
  const silhouette = document.getElementById("expected-silhouette");
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
    silhouette,
  };
}

//global DisplayFeedback function
function DisplayFeedback(message) {
  const userFeedback = document.getElementById("user-feedback");
  userFeedback.innerHTML = message;
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

// rewrite updateSilhouette function to be parameter based instead of whatever this is , even toggleMethod is better than this
// less readable and probably bad code
function updateSilhouette(mode) {
  const silhouette = document.getElementById("expected-silhouette");
  if (!silhouette) return;

  switch (mode) {
    case "start":
      // console.log("silhouette start");
      silhouette.style.opacity = "0.3";
      break;
    case "start_2":
      // “detecting_one” or “ready_one” => silhouette 30%
      silhouette.src = "./assets/side.png";
      silhouette.style.opacity = "0.3";

      break;
    case "disable":
      // “final_state” => remove silhouette
      // silhouette.style.display = "none";
      silhouette.style.opacity = "0";
      break;
    default:
      // If needed, handle "take_photo" or "start_2" or anything else
      // silhouette.style.display = "none";
      break;
  }
}

// async function collapsePose(cameraOutput) {
//   const ctx = cameraOutput.getContext("2d", { willReadFrequently: true });

//   const { width, height } = cameraOutput;

//   // Get the raw RGBA pixel data
//   const imageData = ctx.getImageData(0, 0, width, height);

//   const result = await new Promise((resolve, reject) => {
//     // store the resolver so we can call it in tf1Worker.onmessage
//     workerClassificationResolve = resolve;

//     tf1Worker.postMessage({
//       command: "CLASSIFY_FRAME",
//       data: {
//         width,
//         height,
//         buffer: imageData.data.buffer, // pass ArrayBuffer from typed array
//       },
//     });
//   });

//   if (!result || !result.className) {
//     console.error("Worker classification failed, or no result");
//     return { poseName: null, poseConfidence: 0 };
//   }

//   return {
//     poseName: result.className,
//     poseConfidence: result.probability,
//   };
// }

async function collapsePose(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  // Get the raw RGBA pixel data from the canvas
  const imageData = ctx.getImageData(0, 0, width, height);

  const result = await classifyFrame(width, height, imageData.data.buffer);
  if (!result || !result.className) {
    console.error("Worker classification failed, or no result");
    return { poseName: null, poseConfidence: 0 };
  }
  return {
    poseName: result.className,
    poseConfidence: result.probability,
  };
}
