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


const JavCardV2 = ({ update_obj, source_site, jav_stat_filter, url_access, mark_to }) => {
    const { t, i18n } = useTranslation();
    
    const [card_jav_obj, setCardJavObj] = useState(update_obj);
    const [jav_stat, setJavStat] = useState(Number(card_jav_obj.stat));
    const [loading, setLoading] = useState(false);

    const [magnet_site, setMagnetSite] = useState('overall');
    const [border_style, setBorderStyle] = useState({});
    const _manual_opacity = 1;

    // trigger by parent shortcut key to mark jav read
    useEffect(() => {
        if (mark_to === 1 && jav_stat === 2) {
            //console.log('updating to 1 for: ', _obj.car);
            url_access.schedule(() => fetch(`/local_manager/update_car_ikoa_stat?car=`+String(update_obj.car)+`&stat=`+String(1)))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                if (jsonData.success) {
                    setJavStat(1)
                } else {
                    console.log('Fail to update stat: ', _obj.car, stat_map[1]);
                }
            });
        } else if (mark_to === 0 && jav_stat !== 3 && jav_stat !== 2) {
            //console.log('updating to 1 for: ', _obj.car);
            url_access.schedule(() => fetch(`/local_manager/update_car_ikoa_stat?car=`+String(update_obj.car)+`&stat=`+String(0)))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                if (jsonData.success) {
                    setJavStat(0)
                } else {
                    console.log('Fail to update stat: ', _obj.car, stat_map[1]);
                }
            });
        }
    }, [mark_to])
    
    useEffect(() => {
        if (jav_stat === 3) {
            setBorderStyle({
                borderColor: 'red', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(255, 0, 0, 0.2)',
            })
        } else if (jav_stat === 0) {
            setBorderStyle({
                borderColor: 'green', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(51, 204, 51, 0.2)',
            }) 
        } else if (jav_stat === 4 || jav_stat === 1) {
            setBorderStyle({
                borderColor: 'black', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(0, 0, 0, 0.2)',
            })
        } else if (jav_stat === 2) {
            setBorderStyle({
                borderColor: 'yellow', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(255, 255, 0, 0.2)',
            })
        } else if (jav_stat === 5) {
            setBorderStyle({
                borderColor: 'blue', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(203, 225, 243, 0.5)',
            })
        }
    }, [jav_stat]);
    

    const handleShowDetailImage = () => {
        if (card_jav_obj.image === undefined) {
            setLoading(true);
            fetch(`/jav_browser/get_set_javs?lib_type=${source_site}&set_type=番号&search_string=`+card_jav_obj.car)
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                if (jsonData.error) {
                    console.log(jsonData.error);
                } else {
                    setCardJavObj(old_obj => {
                        old_obj.image = jsonData.success.jav_objs[0].image
                        return old_obj
                    })
                }
                setLoading(false);
            });
        }
    }

    // use card_jav_obj.stat instead of internal jav_stat since we want to keep original state for easier button click
    if ((jav_stat_filter.length > 0 && jav_stat_filter.includes(card_jav_obj.stat)) || jav_stat_filter.length == 0) {
        return (
            <Container fluid>
            <Row style={border_style} key={card_jav_obj.javid} id="main-javcard">
                <Col lg={{span: 12, order: 1}} xl={{order: 1}}>
                    <img style={{opacity: _manual_opacity, maxWidth: "100%", minWidth: "70%"}} src={card_jav_obj.img || card_jav_obj.image}></img>
                </Col>
                <Col lg={{span: 12, order: 2}} xl={{order: 2}}>
                    <Row><Col><p>{card_jav_obj.car} {card_jav_obj.title}</p></Col></Row>
                    <Row><Col>
                    <StatButtonGroup 
                        setbutstat={(_stat) => {
                            setJavStat(_stat)
                        }}
                        stat={jav_stat} 
                        car={card_jav_obj.car}
                        magnet_site={magnet_site}
                        setMagnetSite={setMagnetSite}
                    />
                    </Col></Row>
                    <Row><Col>
                        <JavTable
                            car={card_jav_obj.car}
                            magnet_site={magnet_site}
                            stat={jav_stat} 
                            setJavStat={(_stat) => {
                                setJavStat(_stat)
                            }}
                        />
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
    } else { return `` }
    
};

export default memo(JavCardV2);