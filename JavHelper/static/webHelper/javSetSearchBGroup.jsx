import React, { useState, useEffect }  from 'react';
import Spinner from 'react-bootstrap/Spinner'
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

import { useTranslation } from 'react-i18next';


const JavSetSearchGroup = ({ jav_set_name, source_site, setSourceSite, isLoading, setLoading, updateUrlandLoading,
    setJavSet, setSearchString, setJavObjs, setMaxPage, setPageNum, 
    jav_stat_filter, setJavStatFilter }) => {
    const { t, i18n } = useTranslation();
    const [oofQuota, setOofQuota] = useState('');

    // set the initial value to get quota
    useEffect(() => {
        fetch(`/jav_browser/oof_quota`)
        .then(response => response.json())
        .then((jsonData) => {
            console.log(jsonData.success);
            setOofQuota(jsonData.success)
        });
    }, [])

    const website_set_map = {
        'jav321': ['trending_updates', 'hot_downloads', 'new_release'],
        'javlibrary': ['most_wanted', 'best_rated', 'trending_updates'],
        'javbus': ['subtitled', 'trending_updates'],
        'javdb': ['trending_updates', 'subtitled', 'daily_rank', 'weekly_rank', 'monthly_rank'],
        'jav777': ['trending_updates'],
        'local': ['still_wanted', 'still_downloading', 'iceboxed']
    }
    const [set_toggle_list, setToggleList] = useState(website_set_map[source_site]);

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
        console.log(t('log_switch_jav_set'), event);
        let _set_name = String(event);
        setLoading(true);
        setJavSet(event);
        setSearchString(''); // clean out search string for future page clicks
        setPageNum('1'); // always get 1st page when switching jav sets
        fetch(`/jav_browser/get_set_javs?lib_type=${source_site}&set_type=`+_set_name+`&page_num=`+String(1))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                setJavObjs(jsonData.success.jav_objs);
                setMaxPage(jsonData.success.max_page);
                if (jsonData.errors) {
                    console.log('Error: ', jsonData.error);
                }
                updateUrlandLoading(undefined, _set_name);
                setLoading(false);
            });
    };

    const clickStatFilter = (event) => {
        // triggered from toggle stat filtering group
        const filter_map = JSON.parse(t('filter_map'));
        console.log(t('log_filter'), filter_map[event]);
        if (event === 'w_or_noop') {
            setJavStatFilter([0, 2]);
        } else if (event === 'no_filter') {
            setJavStatFilter([]);
        }
    }

    const changeSourceSite = (event) => {
        // triggered from change website source
        console.log(t('log_change_website'), event);

        // clean current search parameters
        setJavSet(website_set_map[event][0]);
        setSearchString('');
        setPageNum('1');
        setLoading(true);

        setSourceSite(event);
        setToggleList(website_set_map[event]);
    }
  
  
    return(
        <div id="javBrowserToggleGroup">
        <p>{ oofQuota }</p>
        <ToggleButtonGroup size="sm" type="radio" value={jav_set_name} name="pickJavSet" 
            onChange={clickJavSetName} style={{flexWrap: "wrap"}}>
            {set_toggle_list.map(
                function(sent_value){
                    return (
                        <ToggleButton value={sent_value} key={sent_value}>
                            {isLoading ? <Spinner as="span" animation="grow" size="sm" ole="status" aria-hidden="true" />: t(sent_value)}
                        </ToggleButton>
                    )
                }
            )}
        </ToggleButtonGroup>
        <ToggleButtonGroup size="sm" type="radio" value={current_filter} name="statFilter" 
            onChange={clickStatFilter} style={{flexWrap: "wrap", marginLeft: "5px"}}>
            <ToggleButton value={'no_filter'}>
                {t('no_fitler')}
            </ToggleButton>
            <ToggleButton value={'w_or_noop'}>
                {t('w_or_noop')}
            </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="sm" type="radio" value={source_site} name="selectSourceSet" 
            onChange={changeSourceSite} style={{flexWrap: "wrap", marginLeft: "5px", marginTop: "5px"}}>
                {
                    Object.keys(website_set_map).map(
                        function(ind_lib) {
                            return (
                                <ToggleButton value={ind_lib}>
                                    {t(ind_lib)}
                                </ToggleButton>
                            )
                        }
                    )
                }
        </ToggleButtonGroup>
        </div>
  )};
  
  export default JavSetSearchGroup;