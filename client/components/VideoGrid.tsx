import React from "react";

interface VideoGridProps {
  videoUrls: string[];
}

const VideoGrid: React.FC<VideoGridProps> = ({ videoUrls }) => {
  if (!videoUrls || videoUrls.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-4 w-full">
      {videoUrls.map((url, index) => {
        // Extract video ID from YouTube URL
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
