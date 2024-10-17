import * as tf from "@tensorflow/tfjs"; // Ensure TensorFlow.js is imported
import { useEffect } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";

const PoseNetModel = ({ setDetector }) => {
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready(); // tf.ready() does not seem to work for new model , need to find a new way to wait for model loading 
      
      const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER, // Correctly specify the model type
      });
      setDetector(detector);
    };
    loadModel();
  }, [setDetector]);

  return null;
};

export default PoseNetModel;
