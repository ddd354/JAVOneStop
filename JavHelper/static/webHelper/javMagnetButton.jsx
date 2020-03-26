import React, { useState, useEffect }  from 'react';
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

import { useTranslation } from 'react-i18next';

const JavMagnetButton = ({ car, magnet, site, setJavStat }) => {
  const { t, i18n } = useTranslation();

  const [isLoading, setLoading] = useState(false);
  const _car = car;
  const _magnet = magnet;

  useEffect(() => {
      if (isLoading) {
      fetch('/javlib_browser/download_via_aria',
              {method: 'post',
              body: JSON.stringify({
                      "car": _car,
                      "magnet": _magnet
              })})
        .then(response => response.json())
        .then((jsonData) => {
          if (jsonData.success === undefined) {
            console.log(t('log_error'), jsonData.error)
          } else {
            console.log(t('log_aria2_download'), jsonData.success.car);
            setJavStat(4);
          }
          setLoading(false);
        })
  }}, [isLoading]);  //only run when isLoading changes

  const submitDownload = () => setLoading(true);

  if (site === 'jav777') {
    return(
      <a href={_magnet}>download</a>
    )
  } else {
    return(
      <Button
        size="sm"
        style={{fontSize: "10px", padding: "1 1 1 1"}}
        variant="primary"
        disabled={isLoading}
        onClick={!isLoading ? submitDownload: null}
      >
        {isLoading ? <Spinner as="span" animation="grow" size="sm" ole="status" aria-hidden="true" />: t('download_magnet_button')}
      </Button>
        
  )
  }
  };
  
  export default JavMagnetButton;