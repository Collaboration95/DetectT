// utils/workerManager.js

// Create the worker instance
const tf1Worker = new Worker("tf1-worker.js");

// Resolve function for classification responses
let classificationResolve = null;

// Immediately request the worker's version for debugging
tf1Worker.postMessage({ command: "version" });

// Listen for messages from the worker
tf1Worker.onmessage = (e) => {
  const data = e.data;
  if (data.type === "version") {
    console.log("TF1 worker version:", data.version);
  } else if (data.type === "model_loaded") {
    if (data.success) {
      console.log("Teachable Machine model loaded in worker");
    } else {
      console.error("Failed to load model in worker:", data.error);
    }
  } else if (data.type === "classification") {
    if (data.error) {
      console.error("Worker classification error:", data.error);
      classificationResolve && classificationResolve(false);
    } else {
      classificationResolve &&
        classificationResolve({
          className: data.bestClass,
          probability: data.probability,
        });
    }
  }
};

/**
 * Load the Teachable Machine model into the worker.
 * @param {string} modelURL - URL to the model.json
 * @param {string} metadataURL - URL to the metadata.json
 */
function loadModel(modelURL, metadataURL) {
  tf1Worker.postMessage({
    command: "LOAD_MODEL",
    data: { modelURL, metadataURL },
  });
}

/**
 * Send a frame to the worker for classification.
 * @param {number} width - Width of the frame
 * @param {number} height - Height of the frame
 * @param {ArrayBuffer} buffer - The RGBA pixel buffer
 * @returns {Promise<Object>} - Resolves with the classification result
 */
function classifyFrame(width, height, buffer) {
  return new Promise((resolve, reject) => {
    classificationResolve = resolve;
    tf1Worker.postMessage({
      command: "CLASSIFY_FRAME",
      data: { width, height, buffer },
    });
  });
}

export { loadModel, classifyFrame };
