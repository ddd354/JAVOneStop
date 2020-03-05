import React, { useState }  from 'react';
import Spinner from 'react-bootstrap/Spinner'
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

import { useTranslation } from 'react-i18next';

const JavSetSearchGroup = ({ jav_set_name, 
    setJavSet, setSearchString, setJavObjs, setMaxPage, setPageNum, 
    jav_stat_filter, setJavStatFilter }) => {
    const { t, i18n } = useTranslation();
    const [isLoading, setLoading] = useState(false);

    let current_filter = undefined;
    if (jav_stat_filter.length === 0) {
        current_filter = 'no_filter';
    } else if (JSON.stringify(jav_stat_filter) === "[0,2]") {
        current_filter = 'w_or_noop';
    } else {
        debugger;
    }

    const clickJavSetName = (event) => {
        // triggered from toggle group which don't need search string
        console.log('Change jav set to: ', event);
        setLoading(true);
        setJavSet(event);
        setSearchString(''); // clean out search string for future page clicks
        setPageNum('1'); // always get 1st page when switching jav sets
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
    };

    const clickStatFilter = (event) => {
        // triggered from toggle stat filtering group
        console.log('filter on: ', event);
        if (event === 'w_or_noop') {
            setJavStatFilter([0, 2]);
        } else if (event === 'no_filter') {
            setJavStatFilter([]);
        }
    }
  
  
    return(
        <div>
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
        <ToggleButtonGroup size="sm" type="radio" value={current_filter} name="statFilter" 
            onChange={clickStatFilter} style={{flexWrap: "wrap", marginLeft: "5px"}}>
            <ToggleButton value={'no_filter'}>
                {"no filter"}
            </ToggleButton>
            <ToggleButton value={'w_or_noop'}>
                {"wanted/no opinion"}
            </ToggleButton>
        </ToggleButtonGroup>
        </div>
  )};
  
  export default JavSetSearchGroup;