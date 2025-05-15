import React from "react";
import VideoCardSkeleton from "./VideoCardSkeleton";

interface VideoGridProps {
  videoUrls?: string[];
  isLoading?: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ videoUrls, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-4 w-full">
        {[...Array(3)].map((_, index) => (
          <VideoCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!videoUrls || videoUrls.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-4 w-full">
      {videoUrls.map((url, index) => {
        const videoId = url.split("v=")[1];
        if (!videoId) return null;

        return (
          <div key={index} className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={`YouTube video ${index + 1}`}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{ pointerEvents: "auto" }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default VideoGrid;
