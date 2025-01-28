import React from "react";
import Button from "@mui/material/Button";
import { Camera } from "lucide-react";

const CameraControls = ({
  isCameraOn,
  toggleCamera,
  isPoseDetectionOn,
  togglePoseDetection,
}) => (
  <div className="mt-4">
    <Button
      variant="default"
      onClick={toggleCamera}
      className="flex items-center"
    >
      <Camera className="mr-2 h-4 w-4" />
      {isCameraOn ? "Turn Off Camera" : "Launch Camera"}
    </Button>
    {isCameraOn && (
      <div className="mt-4">
        <Button
          variant="default"
          onClick={togglePoseDetection}
          className="flex items-center"
        >
          {isPoseDetectionOn ? "Stop Pose Detection" : "Start Pose Detection"}
        </Button>
      </div>
    )}
  </div>
);

export default CameraControls;
