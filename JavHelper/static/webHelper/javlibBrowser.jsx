import React, { useState, useEffect } from 'react';
import Pagination from 'react-bootstrap/Pagination'
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'

import { useTranslation } from 'react-i18next';
import JavlibCard from './javlibCard'
import './javlibBrowser.css';


const JavlibBroswer = () => {
    const { t, i18n } = useTranslation();
    const [jav_set_name, setJavSet] = useState('most_wanted');
    const [jav_objs, setJavObjs] = useState([]);
    const [page_num, setPageNum] = useState('1');
    const [max_page, setMaxPage] = useState('25');
    const [page_items, setPageItems] = useState();
    const [search_string, setSearchString] = useState('');

    // initialize component
    useEffect(() => {
        fetch(`/jav_browser/get_set_javs?set_type=`+jav_set_name)
            .then(response => response.json())
            .then((jsonData) => {
                if (jsonData.error) {
                    console.log(jsonData.error);
                    setJavObjs([]);
                } else {
                    setJavObjs(jsonData.success.jav_objs);
                    setMaxPage(jsonData.success.max_page);
                }
            });
    }, []);

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
        /*if (_target_num === undefined) {
            debugger;
        }
        console.log(_target_num);*/
        setPageNum(_target_num);
        fetch(`/jav_browser/get_set_javs?set_type=`+jav_set_name+
        `&page_num=`+String(_target_num)+`&search_string=`+String(search_string))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                setJavObjs(jsonData.success.jav_objs);
                setMaxPage(jsonData.success.max_page);
                if (jsonData.errors) {
                    console.log('Error: ', jsonData.error);
                }
            })
    };

    const clickJavSetName = (event) => {
        // triggered from toggle group which don't need search string
        console.log('Change jav set to: ', event);
        setJavSet(event);
        setSearchString(''); // clean out search string for future page clicks
        setPageItems('1'); // always get 1st page when switching jav sets
        fetch(`/jav_browser/get_set_javs?set_type=`+String(event)+`&page_num=`+String(1))
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

    const handleFormSearch = (event) => {
        event.preventDefault();
        console.log('Searching: ', event.target.elements[0].value, event.target.elements[1].value);
        // update react states
        setJavSet(event.target.elements[0].value);
        setSearchString(event.target.elements[1].value);
        setPageNum('1');  // initialize page num to 1 to always get 1st page

        fetch(`/jav_browser/get_set_javs?set_type=`+String(event.target.elements[0].value)+
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
                    <ToggleButtonGroup size="sm" type="radio" value={jav_set_name} name="pickJavSet" 
                        onChange={clickJavSetName} style={{flexWrap: "wrap"}}>
                        <ToggleButton value={'most_wanted'}>{t('most_wanted')}</ToggleButton>
                        <ToggleButton value={'best_rated'}>{t('best_rated')}</ToggleButton>
                        <ToggleButton value={'trending_updates'}>{t('trending_updates')}</ToggleButton>
                        <ToggleButton value={'personal_wanted'}>{t('personal_wanted')}</ToggleButton>
                    </ToggleButtonGroup>
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
                <Pagination size="sm" onClick={handlePageUpdate}>{page_items}</Pagination>
            </div>
            <div>{jav_objs.map(function(jav_obj){
                return <JavlibCard key={jav_obj.car} update_obj={jav_obj}/>})}</div>
            <div>
                <Pagination size="sm" onClick={handlePageUpdate}>{page_items}</Pagination>
            </div>
        </div>
    );
};

export default JavlibBroswer;
