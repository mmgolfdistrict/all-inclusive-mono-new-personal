import React from "react";

// Utility to escape any HTML for safety
const escapeHTML = (str: string) =>
  str.replace(/[&<>"']/g, tag =>
  ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[tag] || tag)
  );

export function formatMessage(message: string): React.ReactNode {
  return message.split("\\n").map((line, index) => {
    // Apply formatting rules in order of complexity
    const formattedLine = line
      // Escape first to avoid raw HTML injection
      .replace(/</g, "&lt;").replace(/>/g, "&gt;")

      // **bold**
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

      // *italic*
      .replace(/(\*|_|_)(.*?)\1/g, "<em>$2</em>")

      // ~~strikethrough~~
      .replace(/~(.*?)~/g, "<del>$1</del>")

      // __underline__
      .replace(/__(.*?)__/g, "<u>$1</u>")

      // `:emoji:` (naive support using emojis only)
      .replace(/:smile:/g, "😄")
      .replace(/:heart:/g, "❤️")
      .replace(/:thumbsup:/g, "👍")
      // Add more emojis as needed

      // Text color: {fg:red}text{/fg}
      .replace(/\{fg:(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\}(.*?)\{\/fg\}/g, '<span style="color:$1;">$2</span>')

      // Background color: {bg:blue}text{/bg}
      .replace(/\{bg:(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\}(.*?)\{\/bg\}/g, '<span style="background-color:$1;">$2</span>')

      // ![alt](url)
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="inline-block max-w-xs max-h-40 rounded" />')

      // [text](url)
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" class="underline text-blue-500" target="_blank" rel="noopener noreferrer">$1</a>'
      );

    return (
      <div
        key={index}
        dangerouslySetInnerHTML={{ __html: formattedLine }}
      />
    );
  });
}
