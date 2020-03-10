import React, { useState, memo } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner'

import StatButtonGroup from "./statButtonGroup";
import JavTable from "./javTable";
import './javBrowserV2.css';


const JavCardV2 = ({ update_obj, source_site }) => {
    const [card_jav_obj, setCardJavObj] = useState(update_obj);
    const [loading, setLoading] = useState(false);

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

    const updateStatFromComponent = (_stat) => {setJavCardStat(_stat)};

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
            });

            `fetch('/local_manager/find_images?car='+card_jav_obj.car)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    if (jsonData.success) {
                        //console.log(file_name, jsonData.success)
                        setCardJavObj(jsonData.success);
                    }
                    setLoading(false);
                });`
        }
    }

    if (jav_card_stat === 0) {
        return (
            <div className="flex-container" style={border_style} key={update_obj.javid} id="main-javcard">
                <div className="jav-image"><img style={{opacity: _manual_opacity}} src={update_obj.img}></img></div>
                <div className="jav-content" style={{width: "100%"}}>
                    <p>{update_obj.car} {update_obj.title}</p>
                    <StatButtonGroup 
                        setbutstat={(_stat) => {setJavCardStat(_stat)}}
                        stat={jav_card_stat} 
                        car={update_obj.car}
                    />
                    <div className="magnetTable">
                        <JavTable
                            car={update_obj.car} 
                            stat={jav_card_stat} 
                            setJavStat={(_stat) => {setJavCardStat(_stat)}}
                        />
                    </div>
                    <Accordion className="detail-image-section">
                        <Card>
                            <Card.Header className="detail-image-button">
                                <Accordion.Toggle as={Button} variant="link" eventKey="0" onClick={handleShowDetailImage}>
                                    {(loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> : "Load Detail Images"}
                                </Accordion.Toggle>
                            </Card.Header>
                            <Accordion.Collapse eventKey="0">
                                <Card.Body>
                                    <img src={card_jav_obj.image}></img>
                                </Card.Body>
                            </Accordion.Collapse>
                        </Card>
                    </Accordion>
                </div>
            </div>)
    } else {
        return (
            <div className="flex-container" style={border_style} key={update_obj.javid} id="main-javcard">
                <div className="jav-image"><img style={{opacity: _manual_opacity}} src={update_obj.img}></img></div>
                <div className="jav-content" style={{width: "100%"}}>
                    <p>{update_obj.car} {update_obj.title}</p>
                    <StatButtonGroup  
                        setbutstat={(_stat) => {setJavCardStat(_stat)}}
                        stat={jav_card_stat} 
                        car={update_obj.car}
                    />
                    <div className="magnetTable">
                    </div>
                    <Accordion className="detail-image-section">
                        <Card>
                            <Card.Header className="detail-image-button">
                                <Accordion.Toggle as={Button} variant="link" eventKey="0" onClick={handleShowDetailImage}>
                                    {(loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> : "Load Detail Images"}
                                </Accordion.Toggle>
                            </Card.Header>
                            <Accordion.Collapse eventKey="0">
                                <Card.Body>
                                    <img src={card_jav_obj.image}></img>
                                </Card.Body>
                            </Accordion.Collapse>
                        </Card>
                    </Accordion>
                </div>
            </div>)
    }
};

export default memo(JavCardV2);