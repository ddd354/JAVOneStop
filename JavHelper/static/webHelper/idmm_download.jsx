import React, { useState, useEffect } from 'react';
import useInterval from '@use-it/interval';

import ProgressBar from 'react-bootstrap/ProgressBar'
import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

import './idmm_download.css'
import { useTranslation } from 'react-i18next';

const IdmmMonitor = ({ server_addr }) => {
    const [good_to_fetch, setFetch] = useState(true);
    const [ikoa_jobs, setIkoaJobs] = useState([]);
    const [dmmc_jobs, setDmmcJobs] = useState([]);

    const { t, i18n } = useTranslation();

    // update job progress every 20s
    useInterval(() => {
        //console.log(server_addr)
        if (good_to_fetch) {
            setFetch(false)
            fetch(server_addr+`flask_celery/list_all_jobs`)
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData);
                let ikoa_jobs = [];
                let dmmc_jobs = [];
                if (jsonData.success) {
                    var job;
                    for (job of jsonData.success) {
                        if (job.queue === 'ikoa') {
                            if (job.meta) {
                                ikoa_jobs.push({
                                    'car': job.car, 'progress': parseInt(job.meta.percentage || ''), 'speed': job.meta.speed, 'state': job.state, 'key': job.car+Math.random().toString(36).substring(7)
                                });
                            } else {
                                ikoa_jobs.push({
                                    'car': job.car, 'state': job.state, 'key': job.car+Math.random().toString(36).substring(7)
                                });
                            }
                        } else if (job.queue === 'dmmc') {
                            if (job.meta) {
                                dmmc_jobs.push({
                                    'car': job.car, 'progress': parseInt(job.meta.percentage || ''), 'speed': job.meta.speed, 'state': job.state, 'key': job.car+Math.random().toString(36).substring(7)
                                });
                            } else {
                                dmmc_jobs.push({
                                    'car': job.car, 'state': job.state, 'key': job.car+Math.random().toString(36).substring(7)
                                });
                            }
                        }
                    }
                    setIkoaJobs(ikoa_jobs);
                    setDmmcJobs(dmmc_jobs);
                }
                setFetch(true)
            });
        }
      }, 10000);

    return (
    <Container fluid>
        <Row>
        <Col xs={{span: 12, order: 1}} md={{span:6, order: 1}}>
            <div id="subDownloader">
            <h3>iKOA download queue</h3>
            <p>Total Job #: {ikoa_jobs.length}</p>
            {
                ikoa_jobs.map(job => {
                    return <div><p>{job.car} {job.state}:</p><ProgressBar key={job.key} animated now={job.progress || ''} label={(job.speed || '')}/></div>
                })
            }
            </div>
        </Col>
        <Col xs={{span: 12, order: 2}} md={{span:6, order: 2}}>
            <div id="subDownloader">
            <h3>DMMC download queue</h3>
            <p>Total Job #: {dmmc_jobs.length}</p>
            {
                dmmc_jobs.map(job => {
                    return <div><p>{job.car} {job.state}:</p><ProgressBar key={job.key} animated now={job.progress || ''} label={(job.speed || '')}/></div>
                })
            }
            </div>
        </Col>
        </Row>
    </Container>
)};

export default IdmmMonitor;

