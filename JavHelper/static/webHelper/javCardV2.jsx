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
import { useEffect } from 'react';


const JavCardV2 = ({ update_obj, stat, source_site, update_parent_javobj_handler }) => {
    const { t, i18n } = useTranslation();
    
    //const [card_jav_obj, setCardJavObj] = useState(update_obj);
    const [loading, setLoading] = useState(false);

    const [magnet_site, setMagnetSite] = useState('overall');
    const [border_style, setBorderStyle] = useState({});

    //const [jav_card_stat, setJavCardStat] = useState(update_obj.stat);
    const _manual_opacity = 1;
    
    useEffect(() => {
        if (stat === 3) {
            setBorderStyle({
                borderColor: 'red', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(255, 0, 0, 0.2)',
            })
        } else if (stat === 0) {
            setBorderStyle({
                borderColor: 'green', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(51, 204, 51, 0.2)',
            }) 
        } else if (stat === 4 || stat === 1) {
            setBorderStyle({
                borderColor: 'black', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(0, 0, 0, 0.2)',
            })
        } else if (stat === 2) {
            setBorderStyle({
                borderColor: 'yellow', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(255, 255, 0, 0.2)',
            })
        }
    }, [stat]);
    

    const handleShowDetailImage = () => {
        if (update_obj.image === undefined) {
            setLoading(true);
            fetch(`/${source_site}/get_set_javs?set_type=番号&search_string=`+update_obj.car)
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                if (jsonData.error) {
                    console.log(jsonData.error);
                } else {
                    update_parent_javobj_handler('image', jsonData.success.jav_objs[0].image);
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
                    setbutstat={(_stat) => {update_parent_javobj_handler('stat', _stat)}}
                    stat={stat} 
                    car={update_obj.car}
                    magnet_site={magnet_site}
                    setMagnetSite={setMagnetSite}
                />
                </Col></Row>
                <Row><Col>
                {
                    (stat === 0) ? <div className="magnetTable">
                    <JavTable
                        car={update_obj.car}
                        magnet_site={magnet_site}
                        stat={stat} 
                        setJavStat={(_stat) => {update_parent_javobj_handler('stat', _stat)}}
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
                                <img style={{maxWidth: '100%'}} src={update_obj.image}></img>
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