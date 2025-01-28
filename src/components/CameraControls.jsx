import React from "react";
import Button from "@mui/material/Button";
import { Camera } from "lucide-react";

const CameraControls = ({
  isCameraOn,
  toggleCamera,
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
  </div>
);

export default CameraControls;
