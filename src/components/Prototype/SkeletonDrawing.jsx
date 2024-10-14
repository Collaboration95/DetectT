import React from "react";

const SkeletonDrawing = ({ detectionInterval, handleIntervalChange }) => {
  return (
    <div className="mt-4">
      <label htmlFor="interval">Detection Interval (ms): </label>
      <input
        type="number"
        id="interval"
        value={detectionInterval}
        onChange={handleIntervalChange}
        min="16"
        max="1000"
        step="16"
      />
    </div>
  );
};

export default SkeletonDrawing;

