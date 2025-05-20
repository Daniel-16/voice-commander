import React from "react";

const ProcessingMessage = () => {
  return (
    <div className="flex items-center space-x-2 bg-[#1C1C27] rounded-full px-4 py-3 max-w-[200px]">
      <div className="flex space-x-1">
        <div
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
      {/* <span className="text-sm text-white">Processing...</span> */}
    </div>
  );
};

export default ProcessingMessage;
