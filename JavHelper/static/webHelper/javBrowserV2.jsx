import React, { useState, useEffect } from 'react';
//import { useParams } from "react-router-dom";

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


const JavBroswerV2 = (props) => {
    let params = new URLSearchParams(props.location.search);

    const { t, i18n } = useTranslation();
    const [source_site, setSourceSite] = useState(params.get('lib_type') || 'javbus');
    const [isLoading, setLoading] = useState(true);

    const [jav_browser_batch_limiter, setUrlLimiter] = useState(new Bottleneck({maxConcurrent: 1}));

    const [jav_objs, setJavObjs] = useState([]);
    const [mark_to, setMarkTo] = useState(99);
    const [jav_stat_filter, setJavStatFilter] = useState([0, 2]);

    const [jav_obj_cards, setJavObjCards] = useState([]);
    const [has_more_obj, setHasMoreObj] = useState(true);

    const [jav_set_name, setJavSet] = useState(params.get('set_type') || 'trending_updates');
    const [page_num, setPageNum] = useState(params.get('page_num') || '1');
    const [max_page, setMaxPage] = useState('25');
    const scroll_trigger = 1.1;
    
    const [search_string, setSearchString] = useState('');

    const updateUrlandLoading = (up_search_str=undefined, up_set_name=undefined) => {
        //console.log('ok', up_search_str, up_set_name);
        let _params = new URLSearchParams(props.location.search);
        _params.set('lib_type', source_site);
        _params.set('set_type', up_set_name || jav_set_name);
        _params.set('page_num', page_num);
        if (up_search_str) { _params.set('search_string', up_search_str); }
        else { _params.delete('search_string') }
        props.history.push(props.location.pathname + "?" + _params.toString());
    }

    // when switching from different site, force an update
    useEffect(() => {
        fetch(`/jav_browser/get_set_javs?lib_type=${source_site}&set_type=`+jav_set_name+
        `&page_num=`+String(page_num)+`&search_string=`+String(search_string))
            .then(response => response.json())
            .then((jsonData) => {
                if (jsonData.error) {
                    console.log(jsonData.error);
                    setJavObjs([]);
                } else {
                    setJavObjs(jsonData.success.jav_objs);
                    setMaxPage(jsonData.success.max_page);
                }
                updateUrlandLoading();
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
                    updateUrlandLoading();
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
        let _search_set = event.target.elements[0].value;
        let _search_str = event.target.elements[1].value;
        console.log(t('log_search_web_jav'), _search_set, _search_str);
        // update react states
        setJavSet(event.target.elements[0].value);
        setSearchString(_search_str);

        // initialize other state
        setLoading(true);
        setPageNum('1');  
        setHasMoreObj(true);

        fetch(`/jav_browser/get_set_javs?lib_type=${source_site}&set_type=`+String(_search_set)+
            `&page_num=`+String(1)+`&search_string=`+String(_search_str))
            .then(response => response.json())
            .then((jsonData) => {
                if (jsonData.error) {
                    updateUrlandLoading(_search_str, _search_set);
                    setLoading(false);
                    console.log('Error: ', jsonData.error);
                }
                //console.log(jsonData.success);
                setJavObjs(jsonData.success.jav_objs);
                setMaxPage(jsonData.success.max_page);
                updateUrlandLoading(_search_str, _search_set);
                setLoading(false);
            });
    };

    const keyMap = {
        next_page: 'd',
        previous_page: 'a',
        mark_all_1: '1',
        mark_all_0: '`'
    };

    function handle_mark_1 () {
        //console.log('pressed 1');
        setMarkTo(1);
        setTimeout(setMarkTo(99), 1000);
    }

    function handle_mark_0 () {
        //console.log('pressed 1');
        setMarkTo(0);
        setTimeout(setMarkTo(99), 1000);
    }

    const hotkey_handlers = {
        next_page: event => setPageNum(prevIndex => String(parseInt(prevIndex)+1)),
        previous_page: event => setPageNum(prevIndex => String(parseInt(prevIndex)-1)),
        mark_all_1: event => handle_mark_1(),
        mark_all_0: event => handle_mark_0(),
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
                        isLoading={isLoading} setLoading={setLoading} updateUrlandLoading={updateUrlandLoading}
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
                                    url_access={jav_browser_batch_limiter} mark_to={mark_to} />
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
