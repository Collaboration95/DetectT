import * as tf from "@tensorflow/tfjs"; // Ensure TensorFlow.js is imported
import { useEffect } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";

const PoseNetModel = ({ setDetector }) => {
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready(); // Ensure TensorFlow.js is ready
      const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, // Correctly specify the model type
      });
      setDetector(detector);
    };
    loadModel();
  }, [setDetector]);

  return null;
};

export default PoseNetModel;
