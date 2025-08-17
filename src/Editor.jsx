import React, { useState } from 'react';

function Editor() {
  const [content, setContent] = useState("");

  return (
    <textarea
      style={{ width: "100%", height: "400px" }}
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />
  );
}

export default Editor;