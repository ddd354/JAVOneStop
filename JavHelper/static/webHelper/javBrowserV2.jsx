import React, { useState, useEffect } from 'react';
import Pagination from 'react-bootstrap/Pagination'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

import InfiniteScroll from 'react-infinite-scroll-component';

import { useTranslation } from 'react-i18next';
import JavSetSearchGroup from './javSetSearchBGroup'
import JavCardV2 from './JavCardV2'
import './javBrowserV2.css';


const JavBroswerV2 = () => {
    const { t, i18n } = useTranslation();
    const [source_site, setSourceSite] = useState('javbus_browser');
    const [isLoading, setLoading] = useState(true);

    const [jav_objs, setJavObjs] = useState([]);
    const [jav_stat_filter, setJavStatFilter] = useState([0, 2]);

    const [jav_obj_cards, setJavObjCards] = useState([]);
    const [has_more_obj, setHasMoreObj] = useState(true);

    const [jav_set_name, setJavSet] = useState('subtitled');
    const [page_num, setPageNum] = useState('1');
    const [max_page, setMaxPage] = useState('25');
    const [page_items, setPageItems] = useState();
    const [search_string, setSearchString] = useState('');

    // initialize component
    useEffect(() => {
        fetch(`/${source_site}/get_set_javs?set_type=`+jav_set_name)
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
    }, []);

    // when switching from different site, force an update
    useEffect(() => {
        fetch(`/${source_site}/get_set_javs?set_type=`+jav_set_name)
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
    useEffect(() => {
        //console.log('updating new jav_objs', jav_objs.length);
        setJavObjCards(jav_objs.map(
                function(jav_obj){
                    if (jav_stat_filter.length > 0) {
                        if (jav_stat_filter.includes(jav_obj.stat)){
                            return <JavCardV2 key={jav_obj.car} update_obj={jav_obj} source_site={source_site} />
                        }
                    } else {
                        return <JavCardV2 key={jav_obj.car} update_obj={jav_obj} source_site={source_site} />
                    }
                }
            ))
    }, [jav_objs, jav_stat_filter]);

    useEffect(() => {
        let _page_items = [];

        for (let number = 1; number <= parseInt(max_page); number++) {
            if (number === 1 && parseInt(page_num) != 1) {
                _page_items.push(<Pagination.First key={1}/>);
            } else if (parseInt(max_page) > 7 && number === parseInt(max_page) 
            && parseInt(page_num) != parseInt(max_page)) {
                _page_items.push(<Pagination.Last key={parseInt(max_page)}/>);
            } else if (parseInt(max_page) > 7 
            && (number >= parseInt(page_num)+3 || number <= parseInt(page_num)-3)) {
                continue;
            } else {
                _page_items.push(
                    <Pagination.Item key={number} active={String(number) === page_num}>
                      {number}
                    </Pagination.Item>,
                  );
            }
        };
        setPageItems(_page_items);
    }, [page_num, max_page]);

    const handlePageUpdate = (e) => {
        // this is triggered from pagination click
        let _target_num = '';
        if (e.target.text === "»Last" || e.target.textContent === "»") {
            _target_num = max_page;
        } else if (e.target.text === "«First" || e.target.textContent === "«") {
            _target_num = '1';
        } else {
            _target_num = e.target.text;
        };
        setPageNum(_target_num);
        fetch(`/${source_site}/get_set_javs?set_type=`+jav_set_name+
        `&page_num=`+String(_target_num)+`&search_string=`+String(search_string))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                setJavObjs(jsonData.success.jav_objs);
                setMaxPage(jsonData.success.max_page);

                if (_target_num === max_page || _target_num === jsonData.success.max_page) {
                    setHasMoreObj(false);
                } else {
                    setHasMoreObj(true);
                }

                if (jsonData.errors) {
                    console.log('Error: ', jsonData.error);
                }
            })
    };

    const handleInfiniteJavFetch = () => {
        // this handles infinite scroll data fetch
        if (has_more_obj) {
            console.log('current page_num: ', page_num);
            let _new_page = String(parseInt(page_num)+1);
            fetch(`/${source_site}/get_set_javs?set_type=`+jav_set_name+
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

                    if (jsonData.errors) {
                        console.log('Error: ', jsonData.error);
                    }
                })
        }
    };

    const handleFormSearch = (event) => {
        event.preventDefault();
        console.log('Searching: ', event.target.elements[0].value, event.target.elements[1].value);
        // update react states
        setJavSet(event.target.elements[0].value);
        setSearchString(event.target.elements[1].value);
        setPageNum('1');  // initialize page num to 1 to always get 1st page

        fetch(`/${source_site}/get_set_javs?set_type=`+String(event.target.elements[0].value)+
            `&page_num=`+String(1)+`&search_string=`+String(event.target.elements[1].value))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                setJavObjs(jsonData.success.jav_objs);
                setMaxPage(jsonData.success.max_page);
                if (jsonData.errors) {
                    console.log('Error: ', jsonData.error);
                }
            });
    };

    return (
        <div>
            <div style={{display: "flex"}}>
                <div style={{width: "50%", display: "flex", justifyContent: "center", alignItems: "center",
                 marginRight: "15px"}}>
                    <JavSetSearchGroup jav_set_name={jav_set_name} 
                        isLoading={isLoading} setLoading={setLoading}
                        source_site={source_site} setSourceSite={setSourceSite}
                        setJavSet={setJavSet} setSearchString={setSearchString} 
                        setJavObjs={setJavObjs} setMaxPage={setMaxPage} setPageNum={setPageNum}
                        jav_stat_filter={jav_stat_filter} setJavStatFilter={setJavStatFilter}
                    />
                </div>
                <div style={{width: "50%"}}>
                    <Form onSubmit={handleFormSearch}>
                        <Form.Row>
                            <Col style={{minWidth: "100px"}}><Form.Group controlId="formGridSearchType">
                            <Form.Label>{t('Search Type')}</Form.Label>
                            <Form.Control as="select">
                                <option>番号</option>
                                <option>女优</option>
                                <option>分类</option>
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
                </div>
            </div>
            <div>
                <Pagination style={{flexWrap: "wrap"}} size="sm" onClick={handlePageUpdate}>{page_items}</Pagination>
            </div>
            <div>
                <InfiniteScroll
                    dataLength={jav_obj_cards.length || 0}
                    //scrollThreshold={0.9}
                    hasMore={has_more_obj}
                    next={handleInfiniteJavFetch}
                    loader={<Spinner animation="border" variant="primary" />}
                    >
                    {jav_obj_cards}
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default JavBroswerV2;
