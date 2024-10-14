import { useEffect, useState } from "react";
import * as posenet from "@tensorflow-models/posenet";
import "@tensorflow/tfjs";

const PoseNetModel = ({ setModel }) => {
  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await posenet.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75,
      });
      setModel(loadedModel);
    };
    loadModel();
  }, [setModel]);

  return null;
};

export default PoseNetModel;
