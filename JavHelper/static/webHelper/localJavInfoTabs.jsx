import React, { useState, memo, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button';

import { useTranslation } from 'react-i18next';
import './javBrowserV2.css';


function arraysEqual(a1,a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)==JSON.stringify(a2);
}

const LocalJavInfoTabPanels = ({ source_name, jav_obj, setJavCardObj }) => {
    const { t, i18n } = useTranslation();

    const [table_rows, setTableRows] = useState([]);

    const handlePlusPickIndex = () => {
        // handles up the up index by one
        let new_pick = 0;
        if (jav_obj[source_name].pick_index+1 > jav_obj[source_name].total_index) {

        } else {
            new_pick = jav_obj[source_name].pick_index+1;
        }
        fetch('/local_manager/new_pick_index_rescrape?car='+jav_obj.car+'&source='+source_name+'&pick_index='+String(new_pick))
            .then(response => response.json())
            .then((jsonData) => {
                // jsonData is parsed json object received from url
                // return can be empty list
                if (jsonData.success) {
                    //console.log(file_name, jsonData.success)
                    setJavCardObj(jsonData.success);
                }
                //setIsScraping(false);
            });

    }

    const handleOverwriteWithInfo = (field, value) => {
        // handles overwrite local nfo with another piece of info
        console.log(`updating ${field} to ${value}`);
        let _new_jav_obj = jav_obj;
        _new_jav_obj[field] = value;
        fetch('/local_manager/update_jav_dict',
            {method: 'post',
            body: JSON.stringify({
                    "update_dict": _new_jav_obj
            })})
            .then(response => response.json())
            .then((jsonData) => {
                // jsonData is parsed json object received from url
                // return can be empty list
                if (jsonData.success != undefined) {
                    setJavCardObj(jsonData.success);
                    console.log('local jav information update succeessful', _new_jav_obj.car);
                } else {
                    console.log('some steps failed for ', _new_jav_obj.car);
                }
            });
    }

    // convert input obj to rows
    useEffect(() => {
        let _table_rows = [];
        //console.log(db_obj, current_source);
        let extract_info = {};
        if (source_name === 'local') {
            // if local then just get rid of source specific data
            for (const [field, value] of Object.entries(jav_obj)) {
                if (typeof value === 'string' || typeof value === 'number') {
                    _table_rows.push(
                        <tr key={field}>
                            <td>{field}</td>
                            <td>{value}</td>
                            <td></td>
                        </tr>
                    );
                } else if (Array.isArray(value)) {
                    _table_rows.push(
                        <tr key={field}>
                            <td>{field}</td>
                            <td>{value.join(', ')}</td>
                            <td></td>
                        </tr>
                    );
                }
            };
        } else {
            extract_info = jav_obj[source_name];
        }
        //console.log(extract_info);
        
        // display individual data source info
        if (typeof extract_info === 'object') {
            for (const [field, value] of Object.entries(extract_info)) {
                if (typeof value === 'string' || typeof value === 'number') {
                    let _action = '';
                    if (field === 'pick_index') {
                        _action = <Button variant="success" size="sm" onClick={handlePlusPickIndex}>+</Button>
                    } else if (value === jav_obj[field]) {
                        _action = <span>&#9745;</span>
                    } else {
                        _action = <Button variant="outline-warning" size="sm" onClick={()=>handleOverwriteWithInfo(field, value)}>^</Button>
                        //console.log(field, value, jav_obj[field]);
                    }
                    _table_rows.push(
                        <tr key={field}>
                            <td>{field}</td>
                            <td>{value}</td>
                            <td>{_action}</td>
                        </tr>
                    );
                } else if (Array.isArray(value)) {
                    let _action = '';
                    if (arraysEqual(value, jav_obj[field])) {
                        _action = <span>&#9745;</span>
                    } else {
                        //console.log(field, value, jav_obj[field]);
                    }
                    _table_rows.push(
                        <tr key={field}>
                            <td>{field}</td>
                            <td>{value.join(', ')}</td>
                            <td>{_action}</td>
                        </tr>
                    );
                }
            };
            setTableRows(_table_rows);
        }
    }, [jav_obj])

    return (
        <Table responsive size="sm">
            <thead>
                <tr>
                <th>{t('javtab_field')}</th>
                <th>{t('javtab_value')}</th>
                <th>{t('javtab_action')}</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </Table>
    );
};


const InfoTabs = ({tab_names, tab_panels}) => {
    //console.log(tab_names, tab_panels);
    if (tab_names.length === tab_panels.length) {
        return (
            <Tabs>
            <TabList>
                {tab_names}
            </TabList>
                {tab_panels}
            </Tabs>
        );
    } else {
        return (<Spinner animation="border" />)
    }
};


const LocalJavInfoTabs = ({ jav_obj, setJavCardObj }) => {
    const [jav_sources, setJavSources] = useState([]);
    const [tab_names, setTabNames] = useState([]);
    const [tab_panels, setTabPanels] = useState([]);

    // init needed tabs
    useEffect(() => {
        fetch('/local_manager/get_necessary_sources')
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    setJavSources(['local'].concat(jsonData.success));
                });
    }, []);

    // update tablist when sources change
    useEffect(() => {
        if (jav_sources.length > 0) {
            let _new_tab_names = [];
            for (const source in jav_sources) {
                _new_tab_names.push(<Tab key={source+'_tab'}>{jav_sources[source]}</Tab>);
            }
            setTabNames(_new_tab_names);
        }
        
    }, [jav_sources]);

    // update tab panel when tablist changes
    useEffect(() => {
        if (tab_names.length > 0) {
            let _tab_panels = [];
            for (const source in tab_names) {
                _tab_panels.push(
                    <TabPanel key={source+'_tabpanel'}>
                        <LocalJavInfoTabPanels source_name={jav_sources[source]} jav_obj={jav_obj} setJavCardObj={setJavCardObj} />
                    </TabPanel>
                );
            }
            setTabPanels(_tab_panels);
        };
    }, [tab_names])

    return (
        <div>
            <InfoTabs tab_names={tab_names} tab_panels={tab_panels} />
        </div>);
};

export default memo(LocalJavInfoTabs);