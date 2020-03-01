import React, { useState, memo } from 'react';

import StatButtonGroup from "./statButtonGroup";
import JavTable from "./javTable";
import './javlibBrowser.css';


const JavlibCard = ({ update_obj }) => {
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
    } else if (jav_card_stat === 4) {
        border_style.borderColor = 'black';
        border_style.background = 'rgba(0, 0, 0, 0.2)';
    } else if (jav_card_stat === 2) {
        border_style.borderColor = 'yellow';
        border_style.background = 'rgba(255, 255, 0, 0.2)';
    }

    const updateStatFromComponent = (_stat) => {setJavCardStat(_stat)};

    if (jav_card_stat === 0) {
        return (
            <div className="flex-container" style={border_style} key={update_obj.javid} id="main-javcard">
                <div className="jav-image"><img style={{opacity: _manual_opacity}} src={"https:"+update_obj.img}></img></div>
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
                </div>
            </div>)
    } else {
        return (
            <div className="flex-container" style={border_style} key={update_obj.javid} id="main-javcard">
                <div className="jav-image"><img style={{opacity: _manual_opacity}} src={"https:"+update_obj.img}></img></div>
                <div className="jav-content" style={{width: "100%"}}>
                    <p>{update_obj.car} {update_obj.title}</p>
                    <StatButtonGroup  
                        setbutstat={(_stat) => {setJavCardStat(_stat)}}
                        stat={jav_card_stat} 
                        car={update_obj.car}
                    />
                    <div className="magnetTable">
                    </div>
                </div>
            </div>)
    }
};

export default memo(JavlibCard);