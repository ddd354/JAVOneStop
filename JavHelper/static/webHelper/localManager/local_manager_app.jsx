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
                scraping={currentState.context.scraping}
                scrape_handler={_ => setCurrentState('SCRAPE', {value: currentState.context.show_list})}
                />
            </Col>
        </Row>
        <Row>
            <Col>
                {currentState.context.show_list.map(ind_file => {
                    return <LocalJavCard key={ind_file.car} jav_info={ind_file}
                    scraping={currentState.context.scraping}
                    scrape_handler={_ => setCurrentState('SCRAPE', {value: [ind_file]})}
                    />
                })}
            </Col>
        </Row>
        </Container>
    )
}

export default LocalManager