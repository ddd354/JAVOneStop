import React from 'react'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import { useTranslation } from 'react-i18next';


const LocalJavCard = ({jav_info, scraping, scrape_handler}) => {
    const { t, i18n } = useTranslation();

    return(
        <Container fluid>
        <Row>
            <Col>{jav_info.car}</Col>
            <Col><Button variant="primary" size="sm" onClick={scrape_handler} disabled={scraping}>
                {(scraping) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : t('scrape_all')}
                </Button></Col>
        </Row>
        <Row>
            <Col>{jav_info.image || jav_info.img}</Col>
            <Col>{
                Object.keys(jav_info).map(function(key){
                    if (key != 'image' && key != 'img' && key != 'car') {
                        return (<p key={`${jav_info.car}_${key}`}>{key}: {jav_info[key]}</p>)
                    }
                })
            }</Col>
        </Row>
        </Container>
    )
}

export default LocalJavCard