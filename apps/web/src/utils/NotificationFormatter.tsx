// utils/formatMessage.tsx
import React from "react";

export function formatMessage(message: string): React.ReactNode {
  return message.split("\\n").map((line, index) => {
    // Basic markdown-style bold & italic — optional
    const formattedLine = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="underline text-blue-500" target="_blank">$1</a>');
    return (
      <div
        key={index}
        dangerouslySetInnerHTML={{ __html: formattedLine }}
      />
    );
  });
}
