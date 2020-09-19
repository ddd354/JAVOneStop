import React, { useState, useEffect } from 'react';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import 'bootstrap/dist/css/bootstrap.min.css';

import { useTranslation } from 'react-i18next';

const StatButtonGroup = (props) => {
  const { t, i18n } = useTranslation();
  const [button_group_value, setButtonGroupValue] = useState(String(props.stat)+'_'+props.car); 

  useEffect(() => {
    setButtonGroupValue(String(props.stat)+'_'+props.car);
  }, [props.stat]);
  
  // event handler
  const buttonClicked = (event) => {
    const stat_map = JSON.parse(t('jav_stat_map'));
    //console.log(event[0], event.slice(2));
    fetch('/jav_browser/update_db_jav',
          {method: 'post',
          body: JSON.stringify({
                  "pk": event.slice(2),
                  "data": {'stat': Number(event[0])}
          })})
          .then(response => response.json())
          .then(resp_json => {
            console.log(t('log_update_jav_stat'), resp_json.success.car, stat_map[resp_json.success.stat]);
          });
    setButtonGroupValue(event);
    props.setbutstat(Number(event[0]));
  };

  return(
    <div>
    <ToggleButtonGroup size="sm" type="radio" 
      value={button_group_value} name="javStat"
      style={{display: "flex", flexWrap: "wrap"}}
      onChange={buttonClicked}>
      <ToggleButton value={'0_'+props.car}>{t('wanted')}</ToggleButton>
      <ToggleButton value={'1_'+props.car}>{t('viewed')}</ToggleButton>
      <ToggleButton value={'2_'+props.car}>{t('no opinion')}</ToggleButton>
      <ToggleButton value={'3_'+props.car}>{t('local')}</ToggleButton>
      <ToggleButton value={'4_'+props.car}>{t('downloading')}</ToggleButton>
      <ToggleButton value={'5_'+props.car}>{t('iceboxed')}</ToggleButton>
    </ToggleButtonGroup>
    <ToggleButtonGroup size="sm" type="radio" value={props.magnet_site} name="selectSourceSet" 
        onChange={(e) => props.setMagnetSite(e)} style={{marginTop: "5px", marginBottom: "5px"}}>
        <ToggleButton value={'overall'}>
            {t("overall")}
        </ToggleButton>
        <ToggleButton value={'ikoa_dmmc'}>
            {"ikoa/dmmc"}
        </ToggleButton>
        <ToggleButton value={'javbus'}>
            {"javbus"}
        </ToggleButton>
        <ToggleButton value={'jav777'}>
            {"jav777"}
        </ToggleButton>
        <ToggleButton value={'torrentkitty'}>
            {"torrentkitty"}
        </ToggleButton>
        <ToggleButton value={'nyaa'}>
            {"nyaa"}
        </ToggleButton>
    </ToggleButtonGroup>
    </div>
)};

export default StatButtonGroup;
