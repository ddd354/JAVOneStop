import React, { useState }  from 'react';
import Spinner from 'react-bootstrap/Spinner'
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

import { useTranslation } from 'react-i18next';

const JavSetSearchGroup = ({ jav_set_name, setJavSet, setSearchString, setJavObjs, setMaxPage, setPageItems }) => {
    const { t, i18n } = useTranslation();
    const [isLoading, setLoading] = useState(false);

    const clickJavSetName = (event) => {
        // triggered from toggle group which don't need search string
        console.log('Change jav set to: ', event);
        setLoading(true);
        setJavSet(event);
        setSearchString(''); // clean out search string for future page clicks
        setPageItems('1'); // always get 1st page when switching jav sets
        fetch(`/jav_browser/get_set_javs?set_type=`+String(event)+`&page_num=`+String(1))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                setJavObjs(jsonData.success.jav_objs);
                setMaxPage(jsonData.success.max_page);
                if (jsonData.errors) {
                    console.log('Error: ', jsonData.error);
                }
                setLoading(false);
            });
    }
  
  
    return(
        <ToggleButtonGroup size="sm" type="radio" value={jav_set_name} name="pickJavSet" 
            onChange={clickJavSetName} style={{flexWrap: "wrap"}}>
            <ToggleButton value={'most_wanted'}>
                {isLoading ? <Spinner as="span" animation="grow" size="sm" ole="status" aria-hidden="true" />: t('most_wanted')}
            </ToggleButton>
            <ToggleButton value={'best_rated'}>
                {isLoading ? <Spinner as="span" animation="grow" size="sm" ole="status" aria-hidden="true" />: t('best_rated')}
            </ToggleButton>
            <ToggleButton value={'trending_updates'}>
                {isLoading ? <Spinner as="span" animation="grow" size="sm" ole="status" aria-hidden="true" />: t('trending_updates')}
            </ToggleButton>
            <ToggleButton value={'personal_wanted'}>
                {isLoading ? <Spinner as="span" animation="grow" size="sm" ole="status" aria-hidden="true" />: t('personal_wanted')}
            </ToggleButton>
        </ToggleButtonGroup>
  )};
  
  export default JavSetSearchGroup;