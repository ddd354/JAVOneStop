import React from 'react';
import { useMachine } from '@xstate/react';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { localManagerState } from './local_manager_state'
import LocalManagerConfigurator from './local_manager_configurator'
import LocalJavCard from './local_jav_card'


const LocalManager = () => {
    const [currentState, setCurrentState] = useMachine(localManagerState)

    return (
        <Container fluid>
        <Row>
            <Col>
                <LocalManagerConfigurator 
                scan_path={currentState.context.scan_path} 
                rescan={_ => setCurrentState('RESCAN')}
                loading={currentState.context.loading}
                preview_rename_handler={_ => setCurrentState('BATCH_PREVIEW_RENAME')}
                rename_handler={_ => setCurrentState('BATCH_RENAME')}
                scrape_handler={_ => setCurrentState('BATCH_SCRAPE')}
                search_handler={(search_str) => setCurrentState('SEARCH_DB', {data: search_str})}
                />
            </Col>
        </Row>
        <Row>
            <Col>
                {currentState.context.show_list.map(ind_machine => {
                    return <LocalJavCard key={ind_machine.car} stateMachine={ind_machine.machine}
                    loading={currentState.context.loading}
                    />
                })}
            </Col>
        </Row>
        </Container>
    )
}

export default LocalManager