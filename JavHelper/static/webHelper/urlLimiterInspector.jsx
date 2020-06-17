import React, { useState, useEffect } from 'react';
import Spinner from 'react-bootstrap/Spinner'

const UrlLimiterInspector = ({url_limiter_stat}) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        //console.log('updating limiter progress: ', url_limiter_stat);
        let _total = Object.values(url_limiter_stat).reduce((a, c)=>a+c, 0)
        if (_total != progress) {
            setProgress(_total)
        }
    }, [url_limiter_stat])

    if (progress > 0) {
        return (
            <div>
                <b>{progress}</b><Spinner animation="border" />
            </div>
        )
    } else {
        return (<p></p>)
    }
}

export default UrlLimiterInspector