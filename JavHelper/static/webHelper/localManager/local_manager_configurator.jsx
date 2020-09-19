import React, {useState, useEffect} from 'react';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import { useTranslation } from 'react-i18next';
import {DebounceInput} from 'react-debounce-input';


function updateScanDirectory(scan_path, call_back, translation) {
    //console.log(`updating path to ${scan_path}`)
    fetch('/directory_scan/update_local_ini',
        {method: 'post',
        body: JSON.stringify({
                "update_dict": {'file_path': scan_path}
        })})
        .then(response => response.json())
        .then((jsonData) => {
            if (jsonData.status != undefined) {
                console.log(translation('update_scan_path'), scan_path);
                call_back()
            } else {
                console.log(translation('update_scan_path_fail'))
            }
        })
}

const LocalManagerConfigurator = ({scan_path, rescan, loading, 
    preview_rename_handler, rename_handler, scrape_handler, search_handler}) => {

    const [searchStr, setSearchStr] = useState();
    const { t, i18n } = useTranslation();

    const searchDB = (search_string) => {
        setSearchStr(search_string);
        search_handler(search_string);
    }

    return (
        <Container fluid>
        <Row>
            <Col xs={12} md={4}>
                <p>Scan Directory: </p>
                <DebounceInput
                    minLength={1}
                    value={scan_path}
                    debounceTimeout={3000}
                    onChange={event => updateScanDirectory(event.target.value, rescan)} />
                <Button variant="primary" size="sm" onClick={_ => updateScanDirectory(scan_path, rescan, t)}>{'\u27F3'}</Button>
            </Col>
            <Col xs={12} md={4}>
                <Row>
                    <Col>
                    <Button variant="primary" size="sm" onClick={scrape_handler} disabled={loading}>
                    {(loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : t('scrape_all')}
                    </Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <Button variant="primary" size="sm" onClick={preview_rename_handler} disabled={loading}>
                    {(loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : t('preview_rename_all')}
                    </Button>
                    </Col>
                    <Col>
                    <Button variant="primary" size="sm" onClick={rename_handler} disabled={loading}>
                    {(loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : t('rename_all')}
                    </Button>
                    </Col>
                </Row>
            </Col>
            <Col xs={12} md={4}>
                <p>Search DB: </p>
                <DebounceInput
                    minLength={1}
                    value={searchStr}
                    debounceTimeout={3000}
                    onChange={event => {
                        searchDB(event.target.value)
                    }} />
                <Button variant="primary" size="sm" onClick={_ => searchDB(searchStr)}>{'\u27F3'}</Button>
            </Col>
        </Row>
        </Container>
    )
}

export default LocalManagerConfigurator