import React, {useState, useEffect} from 'react';
import ReactMarkdown from 'react-markdown/with-html';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { useTranslation } from 'react-i18next';

const HelpDoc = () => {
  const { t, i18n } = useTranslation();

  const [markdown, setMarkdown] = useState('');
  const [markdown_source, setMarkdownSource]= useState('changelog');

  // init with github markdown
  useEffect(() => {
    fetch(`/local_manager/readme?source=${markdown_source}`)
      .then(response => response.json())
      .then((jsonData) => {
          setMarkdown(jsonData.success);
      })
  }, [markdown_source]);

  return (
    <Container>
      <Row><Col>
      <ToggleButtonGroup size="sm" type="radio" value={markdown_source} name="selectMarkdown" 
          onChange={(e) => setMarkdownSource(e)} style={{flexWrap: "wrap", marginLeft: "5px"}}>
          <ToggleButton value={'changelog'}>
              {t('changelog')}
          </ToggleButton>
          <ToggleButton value={'main_readme'}>
              {t('main_readme')}
          </ToggleButton>
          <ToggleButton value={'javdownloader_readme'}>
              {t('javdownloader_readme')}
          </ToggleButton>
      </ToggleButtonGroup>
      </Col></Row>
      <Row><Col>
      <ReactMarkdown
        source={ markdown }
        escapeHtml={false}
        />
      </Col></Row>
    </Container>
  );
}

export default HelpDoc;

