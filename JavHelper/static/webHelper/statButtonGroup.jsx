import React, { useState, useEffect } from 'react';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import 'bootstrap/dist/css/bootstrap.min.css';

const StatButtonGroup = ({ stat, car }) => {
  const [button_group_value, setButtonGroupValue] = useState(String(stat)+'_'+car); 

  useEffect(() => {
    setButtonGroupValue(String(stat)+'_'+car);
  }, [stat]);
  
  // event handler
  const buttonClicked = (event) => {
    //console.log(event[0], event.slice(2));
    fetch('/jav_browser/update_db_jav',
          {method: 'post',
          body: JSON.stringify({
                  "pk": event.slice(2),
                  "data": {'stat': Number(event[0])}
          })})
          .then(response => response.json())
          .then(resp_json => {
            console.log('Update DB Stat: ', resp_json.success);
          });
    setButtonGroupValue(event);
  };

  return(
    <ToggleButtonGroup size="sm" type="radio" value={button_group_value} name="javStat" onChange={buttonClicked}>
      <ToggleButton value={'0_'+car}>wanted</ToggleButton>
      <ToggleButton value={'1_'+car}>viewed</ToggleButton>
      <ToggleButton value={'2_'+car}>no opinion</ToggleButton>
      <ToggleButton value={'3_'+car}>local</ToggleButton>
      <ToggleButton value={'4_'+car}>downloading</ToggleButton>
    </ToggleButtonGroup>
)};

export default StatButtonGroup;
