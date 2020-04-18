import React, { useState, useEffect } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar'
import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

import { useTranslation } from 'react-i18next';

const IdmmMonitor = ({ server_addr }) => {
    const [ikoa_jobs, setIkoaJobs] = useState([]);
    const [dmmc_jobs, setDmmcJobs] = useState([]);

    const { t, i18n } = useTranslation();

    // update job progress every 2s
    useEffect(() => {
        const interval = setInterval(() => {
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
            });
        }, 4000);
        return () => clearInterval(interval);
      }, []);

    return (
    <Container fluid>
        <Row>
        <Col>
        <p>iKOA download queue</p>
        {
            ikoa_jobs.map(job => {
                return <div><p>{job.car} {job.state}:</p><ProgressBar key={job.key} animated now={job.progress || ''} label={(job.speed || '')}/></div>
            })
        }
        </Col>
        <Col>
        <p>DMMC download queue</p>
        {
            dmmc_jobs.map(job => {
                return <div><p>{job.car} {job.state}:</p><ProgressBar key={job.key} animated now={job.progress || ''} label={(job.speed || '')}/></div>
            })
        }
        </Col>
        </Row>
    </Container>
)};

export default IdmmMonitor;

