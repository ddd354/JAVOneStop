import React, {useState, useEffect} from 'react';
import ReactMarkdown from 'react-markdown/with-html';


const HelpDoc = () => {
  const [markdown, setMarkdown] = useState('');

  // init with github markdown
  useEffect(() => {
    fetch('/local_manager/readme')
      .then(response => response.json())
      .then((jsonData) => {
          setMarkdown(jsonData.success);
      })
  }, []);

  return (
    <div style={{padding: "15px"}}>
    <ReactMarkdown
      source={ markdown }
      escapeHtml={false}
      />
    </div>
  );
}

export default HelpDoc;

