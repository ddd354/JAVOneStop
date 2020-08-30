import React, { useState, useEffect } from 'react';

import Pagination from 'rc-pagination'
import index from 'rc-pagination/assets' // import for pagination styling do not remove
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import InfiniteScroll from 'react-infinite-scroll-component';
import { GlobalHotKeys } from "react-hotkeys";
import Bottleneck from "bottleneck";

import JavBrowserChecker from './javBrowserChecker';
import { useTranslation } from 'react-i18next';
import JavSetSearchGroup from './javSetSearchBGroup';
import JavCardV2 from './JavCardV2';
import OofValidator from "./oofValidator"
import './javBrowserV2.css';


const JavBroswerV2 = () => {
    const { t, i18n } = useTranslation();
    const [source_site, setSourceSite] = useState('javbus');
    const [isLoading, setLoading] = useState(true);

    const [jav_browser_batch_limiter, setUrlLimiter] = useState(new Bottleneck({maxConcurrent: 1}));

    const [jav_objs, setJavObjs] = useState([]);
    const [mark_1, setMarkOne] = useState(0);
    const [jav_stat_filter, setJavStatFilter] = useState([0, 2]);

    const [jav_obj_cards, setJavObjCards] = useState([]);
    const [has_more_obj, setHasMoreObj] = useState(true);

    const [jav_set_name, setJavSet] = useState('subtitled');
    const [page_num, setPageNum] = useState('1');
    const [max_page, setMaxPage] = useState('25');
    const scroll_trigger = 1.1;
    
    const [search_string, setSearchString] = useState('');

    // when switching from different site, force an update
    useEffect(() => {
        fetch(`/jav_browser/get_set_javs?lib_type=${source_site}&set_type=${jav_set_name}`)
            .then(response => response.json())
            .then((jsonData) => {
                if (jsonData.error) {
                    console.log(jsonData.error);
                    setJavObjs([]);
                } else {
                    setJavObjs(jsonData.success.jav_objs);
                    setMaxPage(jsonData.success.max_page);
                }
                setLoading(false);
            });
    }, [source_site]);

    // when jav_objs or jav_stat_filter update, update card as well
    /*useEffect(() => {
        // filter based on filter setup
        setJavObjCards()
    }, [jav_objs, jav_stat_filter]);*/

    useEffect(() => {
        if (!isLoading) {
            //console.log('current page change: ', page_num);
            setHasMoreObj(true);  // always has more if page up
            
            setLoading(true);
            fetch(`/jav_browser/get_set_javs?lib_type=${source_site}&set_type=`+jav_set_name+
            `&page_num=`+String(page_num)+`&search_string=`+String(search_string))
                .then(response => response.json())
                .then((jsonData) => {
                    if (jsonData.error) {
                        console.log(jsonData.error);
                        setPageNum(previousPage => previousPage-1)
                    } else {
                        setJavObjs(jsonData.success.jav_objs);
                        setMaxPage(jsonData.success.max_page);

                        if (page_num === max_page || page_num === jsonData.success.max_page) {
                            setHasMoreObj(false);
                        }
                    }
                    setLoading(false);
                })
        }
    }, [page_num]);

    const handleInfiniteJavFetch = () => {
        // this handles infinite scroll data fetch
        console.log(t('log_page_incremental'), page_num);
        let _new_page = String(parseInt(page_num)+1);
        fetch(`/jav_browser/get_set_javs?lib_type=${source_site}&set_type=`+jav_set_name+
        `&page_num=`+String(_new_page)+`&search_string=`+String(search_string))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                setJavObjs(jav_objs.concat(jsonData.success.jav_objs));
                setPageNum(_new_page);
                setMaxPage(jsonData.success.max_page);
                
                setPageNum(_new_page);
                if (_new_page === max_page || _new_page === jsonData.success.max_page) {
                    setHasMoreObj(false);
                } else {
                    setHasMoreObj(true);
                }

                if (jsonData.error) {
                    console.log('Error: ', jsonData.error);
                }
            })
    };

    const handleFormSearch = (event) => {
        event.preventDefault();
        console.log(t('log_search_web_jav'), event.target.elements[0].value, event.target.elements[1].value);
        // update react states
        setJavSet(event.target.elements[0].value);
        setSearchString(event.target.elements[1].value);

        // initialize other state
        setLoading(true);
        setPageNum('1');  
        setHasMoreObj(true);

        fetch(`/jav_browser/get_set_javs?lib_type=${source_site}&set_type=`+String(event.target.elements[0].value)+
            `&page_num=`+String(1)+`&search_string=`+String(event.target.elements[1].value))
            .then(response => response.json())
            .then((jsonData) => {
                if (jsonData.error) {
                    setLoading(false);
                    console.log('Error: ', jsonData.error);
                }
                //console.log(jsonData.success);
                setJavObjs(jsonData.success.jav_objs);
                setMaxPage(jsonData.success.max_page);
                setLoading(false);
            });
    };

    const keyMap = {
        next_page: 'd',
        previous_page: 'a',
        mark_all_1: '1'
    };

    function handle_mark_1 () {
        //console.log('pressed 1');
        setMarkOne(1);
        setTimeout(setMarkOne(0), 1000);
    }

    const hotkey_handlers = {
        next_page: event => setPageNum(prevIndex => String(parseInt(prevIndex)+1)),
        previous_page: event => setPageNum(prevIndex => String(parseInt(prevIndex)-1)),
        mark_all_1: event => handle_mark_1(),
    }

    return (
        <GlobalHotKeys keyMap={keyMap} handlers={hotkey_handlers}>
            {isLoading ? <Spinner id='overlaySpinner' animation="border" size='lg'/> : <div></div>}
        <div>
            <JavBrowserChecker />
            <Container fluid>
                <Row>
                <Col xs={{span: 12, order: 1}} md={{span: 6, order: 1}}>
                    <JavSetSearchGroup jav_set_name={jav_set_name} 
                        isLoading={isLoading} setLoading={setLoading}
                        source_site={source_site} setSourceSite={setSourceSite}
                        setJavSet={setJavSet} setSearchString={setSearchString} 
                        setJavObjs={setJavObjs} setMaxPage={setMaxPage} setPageNum={setPageNum}
                        jav_stat_filter={jav_stat_filter} setJavStatFilter={setJavStatFilter}
                    />
                </Col>
                <Col xs={{span: 12, order: 2}} md={{span: 6, order: 2}}>
                    <Form onSubmit={handleFormSearch}>
                        <Form.Row>
                            <Col style={{minWidth: "100px"}}><Form.Group controlId="formGridSearchType">
                            <Form.Label>{t('Search Type')}</Form.Label>
                            <Form.Control as="select">
                                <option>番号</option>
                                <option>女优</option>
                                <option>分类</option>
                                <option>系列</option>
                            </Form.Control>
                            </Form.Group></Col>
                            <Col><Form.Group controlId="formGridSearchText">
                            <Form.Label>{t('Content')}</Form.Label>
                            <Form.Control />
                            </Form.Group></Col>
                            <Col style={{display: "flex", alignItems: "flex-end", marginBottom: "17px"}}>
                            <Button variant="primary" type="submit">{t('Submit')}</Button></Col>
                        </Form.Row>
                    </Form>
                </Col>
                </Row>
                <Row>
                    <Col><OofValidator /></Col>
                </Row>
            </Container>
            <div style={{padding: "5px"}}>
                <Pagination simple current={parseInt(page_num)} total={parseInt(max_page)} 
                    defaultPageSize={1} showQuickJumper
                    onChange={current => setPageNum(String(current))}
                />
            </div>
            {
                scroll_trigger > 1 ? <div>
                    {
                        jav_objs.map(
                            function(jav_obj){
                                return <JavCardV2 key={jav_obj.car} update_obj={jav_obj} source_site={source_site} jav_stat_filter={jav_stat_filter}
                                    url_access={jav_browser_batch_limiter} mark_1={mark_1} />
                                }
                        )
                    }
                    <div style={{padding: "5px"}}>
                    <Pagination simple current={parseInt(page_num)} total={parseInt(max_page)} 
                        defaultPageSize={1}
                        onChange={current => setPageNum(String(current))}
                    />
                    </div>
                </div> : <div>
                    <InfiniteScroll
                        dataLength={jav_obj_cards.length || 0}
                        scrollThreshold={scroll_trigger}
                        hasMore={has_more_obj}
                        next={handleInfiniteJavFetch}
                        loader={"Loading..."}
                        endMessage={t('scroll_end')}
                        >
                        {jav_obj_cards}
                    </InfiniteScroll>
                    <Button
                        size="sm"
                        style={{fontSize: "10px", padding: "1 1 1 1"}}
                        variant="primary"
                        onClick={handleInfiniteJavFetch}
                    >
                        {t('load_more')}
                    </Button>
                </div>
            }
        </div>
        </GlobalHotKeys>
    );
};

export default JavBroswerV2;
