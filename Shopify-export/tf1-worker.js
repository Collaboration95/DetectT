// tf1-worker.js
importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js"
);

console.log("TF3 Worker Loaded. Version:", tf.version.tfjs); // 3.20.0

// Example: expose a simple function
self.onmessage = async (e) => {
  const { command, data } = e.data;

  if (command === "version") {
    self.postMessage({ type: "version", version: tf.version.tfjs });
  }

  if (command === "predict") {
    // Add your tfjs logic here
    const result = await someTfModelPrediction(data);
    self.postMessage({ type: "result", result });
  }
};

// Example placeholder TF logic
async function someTfModelPrediction(data) {
  const tensor = tf.tensor(data);
  const sum = tensor.sum().arraySync();
  return sum;
}
