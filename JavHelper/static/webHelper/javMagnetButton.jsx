import React, { useState, useEffect }  from 'react';
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

import { useTranslation } from 'react-i18next';

const copyToClipboard = (i_text) => {
  console.log('copied', i_text)
  var textField = document.createElement('textarea')
  textField.innerText = i_text
  document.body.appendChild(textField)
  textField.select()
  document.execCommand('copy')
  textField.remove()
}

const JavMagnetButton = ({ car, download_link, setJavStat, type }) => {
  const { t, i18n } = useTranslation();

  const [isLoading, setLoading] = useState(false);
  const _car = car;
  const _download_link = download_link;

  useEffect(() => {
      if (isLoading && type === 'iframe') {
        fetch(download_link)
        .then(response => response.json())
        .then((jsonData) => {
          if (jsonData.success === undefined) {
            console.log(t('log_error'), jsonData.error)
          } else {
            // set db stat to 4
            fetch(`/local_manager/update_car_ikoa_stat?car=${jsonData.success.car}&stat=4`)
              .then(() => {
                console.log(t('log_idmm_download'), jsonData.success.car);
                setJavStat(4);
              })
          }
          setLoading(false);
        })
      } else if (isLoading) {
        fetch('/jav_browser/download_via_aria',
              {method: 'post',
              body: JSON.stringify({
                      "car": _car,
                      "magnet": _download_link
              })})
        .then(response => response.json())
        .then((jsonData) => {
          if (jsonData.success === undefined) {
            console.log(t('log_error'), jsonData.error)
            // don't allow redownload if failed
          } else {
            fetch(`/local_manager/update_car_ikoa_stat?car=${jsonData.success.car}&stat=4`)
              .then(() => {
                console.log(t('log_aria2_download'), jsonData.success.car);
                setJavStat(4);
              })
            setLoading(false);
          }
        })
  }}, [isLoading]);  //only run when isLoading changes

  const submitDownload = () => setLoading(true);

  if (_download_link.startsWith('magnet:')) {
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
  } else if (type === 'iframe') {
    return(
      <Button
        size="sm"
        style={{fontSize: "10px", padding: "1 1 1 1"}}
        variant="primary"
        disabled={isLoading}
        onClick={!isLoading ? submitDownload: null}
      >
        {isLoading ? <Spinner as="span" animation="grow" size="sm" ole="status" aria-hidden="true" />: t('download_iframe_button')}
      </Button>    
    )
  } else {
    return(
      <a onClick={() => {copyToClipboard(car)}} href={_download_link} rel="noreferrer" target="_blank">{t('download_web_button')}</a>
    )
  }
  };
  
  export default JavMagnetButton;