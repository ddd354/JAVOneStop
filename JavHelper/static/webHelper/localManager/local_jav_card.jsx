import React from 'react'
import { useService } from '@xstate/react';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image'

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

const LocalJavCard = ({stateMachine, loading}) => {
    const { t, i18n } = useTranslation();
    const [localState, setLocalState] = useService(stateMachine);

    if (localState.matches('finish')) {
        return (<p></p>)
    }

    return(
        <Container fluid>
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
        </Row>
        <Row>
            {//<Col><Image src={localState.context.jav_info.image || localState.context.jav_info.img} fluid/></Col>
            }
            <Col>
            {
                // red high lighted text for new file rename
                localState.context.new_file_name && <p style={{color: 'red'}}>new_name: {localState.context.new_file_name}</p>
            }
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
                <DataTable columns={[{selector:'key'}, {selector:'data'}]}/>
            </TabPanel>
            {
                Object.keys(localState.context.jav_info).map(function(key){
                    if (key != 'image' && key != 'img' && key != 'car' && !isDict(localState.context.jav_info[key])) {
                        return (<p key={`${localState.context.jav_info.car}_${key}`}>{key}: {`${localState.context.jav_info[key]}`}</p>)
                    }
                })
            }</Col>
        </Row>
        </Container>
    )
}

export default LocalJavCard