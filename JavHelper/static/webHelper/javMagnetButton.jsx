import React, { useState, useEffect }  from 'react';
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

const JavMagnetButton = ({ car, magnet, index, setJavStat }) => {
    const [isLoading, setLoading] = useState(false);
    const _car = car;
    const _magnet = magnet;
    const _index = index;
  
    useEffect(() => {
        if (isLoading) {
        fetch('/jav_browser/download_via_aria',
                {method: 'post',
                body: JSON.stringify({
                        "car": _car,
                        "magnet": _magnet
                })})
          .then(response => response.json())
          .then((jsonData) => {
            if (jsonData.success === undefined) {
              console.log('failed on: ', jsonData.error)
            } else {
              console.log('aria2 downloadeding: ', jsonData.success.car);
              setJavStat(_index, 4);
            }
            setLoading(false);
          })
    }}, [isLoading]);  //only run when isLoading changes

    const submitDownload = () => setLoading(true);
  
    return(
      <Button
        size="sm"
        variant="primary"
        disabled={isLoading}
        onClick={!isLoading ? submitDownload: null}
      >
        {isLoading ? <Spinner as="span" animation="grow" size="sm" ole="status" aria-hidden="true" />: 'Download'}
      </Button>
        
  )};
  
  export default JavMagnetButton;