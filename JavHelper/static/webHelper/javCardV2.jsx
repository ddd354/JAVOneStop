import React, { useState, memo } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { useTranslation } from 'react-i18next';

import StatButtonGroup from "./statButtonGroup";
import JavTable from "./javTable";
import './javBrowserV2.css';


const JavCardV2 = ({ update_obj, source_site }) => {
    const { t, i18n } = useTranslation();
    
    const [card_jav_obj, setCardJavObj] = useState(update_obj);
    const [loading, setLoading] = useState(false);

    const [magnet_site, setMagnetSite] = useState('overall');

    const [jav_card_stat, setJavCardStat] = useState(update_obj.stat);
    const _manual_opacity = 1;
    
    let border_style = {
        borderColor: 'green', 
        borderWidth: '2px', 
        borderStyle: 'solid',
        marginBottom: '20px',
        background: 'rgba(51, 204, 51, 0.2)',
    };
    if (update_obj.directory) {
        border_style.borderColor = 'red';
        border_style.background = 'rgba(255, 0, 0, 0.2)';
    } else if (jav_card_stat === 4 || jav_card_stat === 1) {
        border_style.borderColor = 'black';
        border_style.background = 'rgba(0, 0, 0, 0.2)';
    } else if (jav_card_stat === 2) {
        border_style.borderColor = 'yellow';
        border_style.background = 'rgba(255, 255, 0, 0.2)';
    }

    const handleShowDetailImage = () => {
        if (card_jav_obj.image === undefined) {
            setLoading(true);
            fetch(`/${source_site}/get_set_javs?set_type=番号&search_string=`+card_jav_obj.car)
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                setCardJavObj(jsonData.success.jav_objs[0]);
                if (jsonData.errors) {
                    console.log('Error: ', jsonData.error);
                }
                setLoading(false);
            });
        }
    }

    return (
        <Container>
        <Row xs={1} md={2} style={border_style} key={update_obj.javid} id="main-javcard">
            <Col xs={{span: 12, order: 1}} md={{span: 4, order: 1}}><img style={{opacity: _manual_opacity, maxWidth: "100%"}} src={update_obj.img}></img></Col>
            <Col xs={{span: 12, order: 2}} md={{span: 8, order: 2}}>
                <Row><Col><p>{update_obj.car} {update_obj.title}</p></Col></Row>
                <Row><Col>
                <StatButtonGroup 
                    setbutstat={(_stat) => {setJavCardStat(_stat)}}
                    stat={jav_card_stat} 
                    car={update_obj.car}
                    magnet_site={magnet_site}
                    setMagnetSite={setMagnetSite}
                />
                </Col></Row>
                <Row><Col>
                {
                    (jav_card_stat === 0) ? <div className="magnetTable">
                    <JavTable
                        car={update_obj.car}
                        magnet_site={magnet_site}
                        stat={jav_card_stat} 
                        setJavStat={(_stat) => {setJavCardStat(_stat)}}
                    />
                </div> : ''
                }
                </Col></Row>
                <Row><Col>
                <Accordion className="detail-image-section">
                    <Card>
                        <Card.Header className="detail-image-button">
                            <Accordion.Toggle as={Button} variant="link" eventKey="0" onClick={handleShowDetailImage}>
                                {(loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> : t('load_detail_image_tab_name')}
                            </Accordion.Toggle>
                        </Card.Header>
                        <Accordion.Collapse eventKey="0">
                            <Card.Body>
                                <img style={{maxWidth: '100%'}} src={card_jav_obj.image}></img>
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                </Accordion>
                </Col></Row>
            </Col>
        </Row>
        </Container>)
};

export default memo(JavCardV2);