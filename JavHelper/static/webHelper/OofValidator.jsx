import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Iframe from 'react-iframe'

import { useTranslation } from 'react-i18next';


const OofValidator = () => {
  const { t, i18n } = useTranslation();

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div>
      <Button variant="primary" onClick={handleShow}>
        {t('validate_oof_tool')}
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t('oof_validate_instruction')}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{minWidth: "360px", minHeight: "493px"}}>
          <Iframe url="https://captchaapi.115.com/?ac=security_code&type=web"
            width="360px" height="493px"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {t('close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default OofValidator;

