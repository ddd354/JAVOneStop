import React from 'react'
import { useService } from '@xstate/react';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image'
import Spinner from 'react-bootstrap/Spinner'

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import DataTable from 'react-data-table-component';

import {DebounceInput} from 'react-debounce-input';
import { useTranslation } from 'react-i18next';


const hasFileName = (file_name) => {
    return Boolean(file_name) && !file_name.endsWith('.nfo')
}

function isDict(v) {
    return typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date);
}

const valueNotEqual = (v1, v2) => {
    return v1 !== v2
}

const LocalJavCard = ({stateMachine, loading}) => {
    const { t, i18n } = useTranslation();
    const [localState, setLocalState] = useService(stateMachine);

    if (localState.matches('finish')) {
        return (<p></p>)
    }

    const cardStyle = {
        borderColor: 'blue', 
        borderWidth: '2px', 
        borderStyle: 'solid',
        padding: '10px',
        marginBottom: '20px',
        background: 'rgba(203, 225, 243, 0.5)',
    }

    return(
        <Container fluid>
        <Row style={cardStyle}><Col>
        <Row>
            <Col>{localState.context.jav_info.car}</Col>
            {Boolean(localState.context.jav_info.car) && <Col><Row>
                <Button variant="primary" size="sm" 
                    onClick={_ => setLocalState('SCRAPE_DB', {data: localState.context.jav_info.car})} 
                    disabled={loading || localState.context.loading}>
                    {t('refresh_db')}
                    </Button>
                </Row></Col>}

            {localState.matches('show_info') && hasFileName(localState.context.jav_info.file_name) && <Col><Row>
            <Button variant="primary" size="sm" 
                onClick={_ => setLocalState('PREVIEW_RENAME')} 
                disabled={loading || localState.context.loading}>
                {t('preview_rename')}
                </Button>
            <Button variant="primary" size="sm" 
            onClick={_ => setLocalState('SCRAPE')} 
            disabled={loading || localState.context.loading}>
            {t('single_scrape')}
            </Button>
            <Button variant="primary" size="sm" 
                onClick={_ => setLocalState('FORCE_RENAME')} 
                disabled={loading || localState.context.loading}>
                {t('force_rename')}
                </Button>
            </Row></Col>}

            {localState.matches('preview_rename') && 
            <Col><DebounceInput
                minLength={1}
                value={localState.context.new_file_name}
                debounceTimeout={3000}
                onChange={event => setLocalState('UP_PREVIEW_NAME', {data: event.target.value})} />
                <Button variant="primary" size="sm" 
                onClick={_ => setLocalState('RENAME')} 
                disabled={loading || localState.context.loading}>
                {t('rename')}
                </Button>
                <Button variant="primary" size="sm" 
                onClick={_ => setLocalState('BACK_INFO')} 
                disabled={loading || localState.context.loading}>
                {t('exit_rename')}
                </Button>
            </Col>
            }
            {
                localState.matches('db_result') && <Col>
                    <Button variant="danger" size="sm" onClick={_ => setLocalState('WRITE_NFO')} disabled={localState.context.loading}>{(localState.context.loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> :  t('rewrite_nfo')}</Button>
                    <Button variant="danger" size="sm" onClick={_ => setLocalState('WRITE_IMAGE')} disabled={localState.context.loading}>{(localState.context.loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> :  t('rewrite_images')}</Button>
                </Col>
            }
        </Row>
        <Row>
        <Col>
            {
                // red high lighted text for new file rename
                localState.context.new_file_name && <p style={{color: 'red'}}>new_name: {localState.context.new_file_name}</p>
            }
            <Tabs>
            <TabList>
                <Tab>{t('nfo_write_info')}</Tab>
                {
                    Object.keys(localState.context.jav_info).map(function(key){
                        if (isDict(localState.context.jav_info[key])) {
                            return (<Tab>{key}</Tab>)
                        }
                    })
                }
            </TabList>
            <TabPanel>
                <Row>
                <Col xs={6}><Image src={localState.context.jav_info.image || localState.context.jav_info.img} fluid/></Col>
                <Col xs={6}>
                {
                    Object.keys(localState.context.jav_info).map(function(key){
                        if (key != 'image' && key != 'img' && key != 'car' && !isDict(localState.context.jav_info[key])) {
                            return (<p key={`${localState.context.jav_info.car}_${key}`}>{key}: {`${localState.context.jav_info[key]}`}</p>)
                        }
                    })
                }
                </Col>
                </Row>
            </TabPanel>
            {
                Object.keys(localState.context.jav_info).map(function(key){
                    if (isDict(localState.context.jav_info[key])) {
                        let _data = [];
                        for (let _k in localState.context.jav_info[key]) {
                            let _row_data = {key: _k, value: localState.context.jav_info[key][_k]};
                            if (_k !== 'pick_index' && _k !== 'total_index' && _k !== 'car'
                                && valueNotEqual(localState.context.jav_info[key][_k], localState.context.jav_info[_k])) {
                                _row_data['action'] = 
                                <Button variant="outline-warning" size="sm" 
                                    onClick={_ => setLocalState('OVERWRITE_JAV_INFO', 
                                    {update_dict: {key: _k, value: localState.context.jav_info[key][_k]}})}>^
                                </Button>
                            }
                            _data.push(_row_data);
                        }
                        return (
                            <TabPanel>
                                <Row>
                                <Col xs={6}><Image src={localState.context.jav_info[key].image || localState.context.jav_info[key].img} fluid/></Col>
                                <Col xs={6}>
                                <DataTable columns={[{name: 'key', selector:'key', compact: true, wrap: true, maxWidth: '30px'}, 
                                        {name: 'value', selector:'value', compact: true, wrap: true},
                                        {name: 'action', selector:'action', compact: true},
                                    ]} 
                                data={_data} 
                                customStyles={{rows: {style: {backgroundColor: 'transparent'}}, 
                                                table: {style: {backgroundColor: 'transparent'}}
                                            }}
                                dense noTableHead noHeader/>
                                </Col>
                                </Row>
                            </TabPanel>
                        )
                    }
                })
            }
            </Tabs>
        </Col>
        </Row>
        </Col></Row>
        </Container>
    )
}

export default LocalJavCard