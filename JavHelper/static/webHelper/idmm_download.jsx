import React, { useState, useEffect } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar'

import { useTranslation } from 'react-i18next';

const IdmmMonitor = ({ server_addr }) => {
    const [jobs, setJobs] = useState([]);

    const { t, i18n } = useTranslation();

    // update job progress every 2s
    useEffect(() => {
        const interval = setInterval(() => {
            fetch(server_addr+`flask_celery/list_all_jobs`)
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData);
                let _jobs = [];
                if (jsonData.success) {
                    var job;
                    for (job of jsonData.success) {
                        if (job.meta) {
                            _jobs.push({
                                'car': job.car, 'progress': parseInt(job.meta.percentage || ''), 'speed': job.meta.speed, 'state': job.state, 'key': job.car+Math.random().toString(36).substring(7)
                            });
                        } else {
                            _jobs.push({
                                'car': job.car, 'state': job.state, 'key': job.car+Math.random().toString(36).substring(7)
                            });
                        }
                        
                    }
                    setJobs(_jobs);
                }
            });
        }, 4000);
        return () => clearInterval(interval);
      }, []);

    return (
    <div>
        {
            jobs.map(job => {
                return <div><p>{job.car} {job.state}:</p><ProgressBar key={job.key} animated now={job.progress || ''} label={(job.speed || '')}/></div>
            })
        }
    </div>
)};

export default IdmmMonitor;

