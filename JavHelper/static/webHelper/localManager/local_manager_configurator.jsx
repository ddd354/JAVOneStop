import React, {useState, useEffect} from 'react';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import { useTranslation } from 'react-i18next';
import {DebounceInput} from 'react-debounce-input';


function updateScanDirectory(scan_path, call_back) {
    console.log(`updating path to ${scan_path}`)
    fetch('/directory_scan/update_local_ini',
        {method: 'post',
        body: JSON.stringify({
                "update_dict": {'file_path': scan_path}
        })})
        .then(response => response.json())
        .then((jsonData) => {
            if (jsonData.status != undefined) {
                console.log('Succeessful updated scan path: ', scan_path);
                call_back()
            } else {
                console.log('update fail')
            }
        })
}

const LocalManagerConfigurator = ({scan_path, rescan, scraping, scrape_handler}) => {
    const { t, i18n } = useTranslation();

    return (
        <Container fluid>
        <Row>
            <Col>
            <p>Scan Directory: </p>
            <DebounceInput
                minLength={1}
                value={scan_path}
                debounceTimeout={3000}
                onChange={event => updateScanDirectory(event.target.value, rescan)} />
            </Col>
            <Col><Button variant="primary" size="sm" onClick={scrape_handler} disabled={scraping}>
                {(scraping) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : t('scrape_all')}
            </Button></Col>
        </Row>
        </Container>
    )
}

export default LocalManagerConfigurator