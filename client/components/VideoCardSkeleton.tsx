import React from "react";

const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="relative aspect-video w-full bg-gray-700 rounded-lg animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
      </div>
    </div>
  );
};

export default VideoCardSkeleton;
