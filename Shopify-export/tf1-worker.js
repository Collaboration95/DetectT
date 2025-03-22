// tf1-worker.js

// 1) Load TFJS 1.3.1 (UMD). This puts "tf" on self (the worker global).
importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js"
);

// 2) Load an older version of the TeachableMachine Pose library that works with TFJS 1.x
importScripts(
  "https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js"
);

console.log("TF1 Worker loaded. TFJS version:", tf.version.tfjs);

let tmModel = null; // store the loaded model

// 3) Listen for messages from main thread
self.onmessage = async (e) => {
  const { command, data } = e.data;

  // (A) Return the version (for debugging)
  if (command === "version") {
    self.postMessage({ type: "version", version: tf.version.tfjs });
  }

  // (B) Load the Teachable Machine pose model
  if (command === "LOAD_MODEL") {
    try {
      // data.modelURL, data.metadataURL are the URLs you pass in
      // e.g. model.json, metadata.json
      tmModel = await tmPose.load(data.modelURL, data.metadataURL);
      self.postMessage({ type: "model_loaded", success: true });
    } catch (err) {
      self.postMessage({ type: "model_loaded", success: false, error: err });
    }
  }

  // (C) Classify a single frame (ImageData)
  if (command === "CLASSIFY_FRAME") {
    if (!tmModel) {
      // Model not loaded yet
      self.postMessage({ type: "classification", error: "No model loaded" });
      return;
    }
    try {
      // 1. Convert the incoming ImageData to a HTMLCanvasElement
      const { width, height, buffer } = data; // from main thread
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Put raw RGBA pixels into an ImageData
      const imageData = new ImageData(
        new Uint8ClampedArray(buffer),
        width,
        height
      );
      ctx.putImageData(imageData, 0, 0);

      // 2. Estimate pose from the Teachable Machine model
      const { pose: tmPoseOutput, posenetOutput } =
        await tmModel.estimatePose(canvas);

      // 3. Run classification
      const predictions = await tmModel.predict(posenetOutput);

      // 4. Find best class
      let best = predictions.reduce((a, b) =>
        a.probability > b.probability ? a : b
      );

      // 5. Return result
      self.postMessage({
        type: "classification",
        bestClass: best.className,
        probability: best.probability,
      });
    } catch (err) {
      self.postMessage({ type: "classification", error: err.toString() });
    }
  }
};
