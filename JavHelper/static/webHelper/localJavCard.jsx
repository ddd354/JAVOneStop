import React, { useState, memo, useEffect } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

import './javlibBrowser.css';
import LocalJavInfoTabs from './localJavInfoTabs';


const LocalJavCard = ({ update_obj, handleRemove, global_loading, setGlobalLoading}) => {
    const [javcard_obj, setJavCardObj] = useState(update_obj);
    const [local_stat, setLocalStat] = useState(false);
    const [show_image, setShowImage] = useState()
    const [is_scraping, setIsScraping] = useState(false);
    const _global_loading = global_loading;
    const _setGlobalLoading = setGlobalLoading;
    const _manual_opacity = 0.1;
    const _handleRemoveFunc = handleRemove;
    
    let border_style = {
        borderWidth: '2px', 
        borderStyle: 'solid',
        marginBottom: '20px',
    };

    //init local stat
    useEffect(() => {
        // we only verify local stat when db showing already organized
        if (javcard_obj.directory != undefined && javcard_obj.file_name != undefined) {
            fetch('/directory_scan/verify_local_nfo?directory='+javcard_obj.directory+'&filename='+javcard_obj.file_name)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    if (jsonData.success === true) {
                        //console.log(file_name, jsonData.success)
                        setLocalStat(true)
                    } else {
                        setLocalStat(false)
                    }
                });
            // if db don't have image / img info, we try to fill it in
            if (javcard_obj.image === undefined && javcard_obj.img === undefined) {
                console.log(javcard_obj.image, javcard_obj.img);
                re_srape_jav(javcard_obj);
            }
        }
    }, []);

    function re_srape_jav (jav_obj) {
        fetch('/local_manager/find_images?car='+jav_obj.car)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    if (jsonData.success) {
                        //console.log(file_name, jsonData.success)
                        setJavCardObj(jsonData.success);
                    }
                    setIsScraping(false);
                });
    };

    const handleReScrapeClick = () => {
        setIsScraping(true);
        re_srape_jav(javcard_obj);
    }

    useEffect(() => {
        if (javcard_obj.image) {
            setShowImage(javcard_obj.image);
        } else {
            setShowImage(javcard_obj.img);
        }
    }, [javcard_obj])

    const handleRewriteNfo = () => {
        fetch('/local_manager/rewrite_nfo',
            {method: 'post',
            body: JSON.stringify({
                    "update_dict": javcard_obj
            })})
            .then(response => response.json())
            .then((jsonData) => {
                // jsonData is parsed json object received from url
                // return can be empty list
                if (jsonData.success != undefined) {
                    console.log('nfo rewrite succeessful', javcard_obj.car);
                }
            });
    };

    const handleRewriteImages = () => {
        fetch('/local_manager/rewrite_images',
            {method: 'post',
            body: JSON.stringify({
                    "update_dict": javcard_obj
            })})
            .then(response => response.json())
            .then((jsonData) => {
                // jsonData is parsed json object received from url
                // return can be empty list
                if (jsonData.success != undefined) {
                    console.log('images rewrite succeessful', javcard_obj.car);
                }
            });
    };

    const handleMigrateJav = () => {
        fetch('/local_manager/restructure_jav',
            {method: 'post',
            body: JSON.stringify({
                    "update_dict": javcard_obj
            })})
            .then(response => response.json())
            .then((jsonData) => {
                // jsonData is parsed json object received from url
                // return can be empty list
                if (jsonData.success != undefined) {
                    console.log('nfo rewrite succeessful', javcard_obj.car);
                }
            });
    };

    const handleSingleScrape = () => {
        setIsScraping(true);
        _setGlobalLoading(true);
        fetch('/local_manager/single_scrape',
            {method: 'post',
            body: JSON.stringify({
                    "update_dict": javcard_obj
            })})
            .then(response => response.json())
            .then((jsonData) => {
                // jsonData is parsed json object received from url
                // return can be empty list
                if (jsonData.success != undefined) {
                    console.log('Succeessful scraped: ', javcard_obj.car);
                    _handleRemoveFunc(javcard_obj.car);
                } else if (jsonData.errors) {
                    console.log(jsonData.errors);
                } else {
                    console.log('[FATAL ERROR] cannot scrape: ', javcard_obj.car);
                };
                _setGlobalLoading(false);
                setIsScraping(false);
            });
    };

    return (
        <div className="flex-container" style={border_style} key={javcard_obj.car} id="main-javcard">
            <div className="jav-image" style={{width: "30%"}}>
                <img style={{opacity: _manual_opacity, maxWidth: "100%"}} 
                    src={show_image}>
                </img>
            </div>
            <div className="jav-content" style={{width: "70%"}}>
                <p>{javcard_obj.car} 
                    {javcard_obj.title} 
                    {(local_stat) ? <Badge variant="primary">Local</Badge> : <Badge variant="danger">Not Organized</Badge>}
                </p>
                {
                    (javcard_obj.directory && javcard_obj.file_name) 
                    ? <Button variant="danger" size="sm" onClick={handleMigrateJav} disabled={_global_loading}>{(is_scraping) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Migrate Jav"}</Button>
                    : ""
                }
                {' '}
                {
                    (javcard_obj.directory && javcard_obj.file_name) 
                    ? <Button variant="danger" size="sm" onClick={handleRewriteNfo} disabled={_global_loading}>{(is_scraping) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Rewrite Nfo"}</Button>
                    : <Button variant="success" size="sm" onClick={handleSingleScrape} disabled={_global_loading}>{(is_scraping) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Single Scrape"}</Button>
                }
                {' '}
                {
                    (javcard_obj.image) 
                    ? <Button variant="danger" size="sm" onClick={handleRewriteImages} disabled={_global_loading}>{(is_scraping) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Rewrite Images"}</Button>
                    : ""
                }
                {' '}
                <Button variant="outline-primary" onClick={handleReScrapeClick}>{
                    (is_scraping) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Re-Scrape"}
                </Button>
                <LocalJavInfoTabs jav_obj={javcard_obj} setJavCardObj={setJavCardObj} />
            </div>
        </div>);
};

export default memo(LocalJavCard);