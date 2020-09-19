import React, { useState, useEffect } from 'react';
import Toast from 'react-bootstrap/Toast';

import './javBrowserChecker.css'

const JavBrowserChecker = () => {
    const [warning_toasts, setWarningToasts] =useState('');

    // initialize with non-dismissible warnings (unless reload)
    useEffect(() => {
        let _warning = [];
        fetch(`/jav_browser/diagnose_downloader_setup`)
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                if (jsonData.error) {
                    for (const [f, m] of Object.entries(jsonData.error)) {
                        _warning.push(
                            <Toast key={f} className="ind-download-checker-toast">
                                <Toast.Body>{m}</Toast.Body>
                            </Toast>
                        );
                    }
                }
            });
        setWarningToasts(_warning);
    }, [])
    
    return (<div className="warning-toasts">{warning_toasts}</div>)
};

export default JavBrowserChecker;