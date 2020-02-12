import React, { useState, useEffect } from 'react';
import Pagination from 'react-bootstrap/Pagination'
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

import JavlibCard from './javlibCard'
import './javlibBrowser.css';


const JavlibBroswer = () => {
    const [jav_set_name, setJavSet] = useState('most_wanted');
    const [jav_objs, setJavObjs] = useState([]);
    const [page_num, setPageNum] = useState('1');
    const [max_page, setMaxPage] = useState('25');
    const [page_items, setPageItems] = useState();

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
            _page_items.push(
              <Pagination.Item key={number} active={String(number) === page_num}>
                {number}
              </Pagination.Item>,
            );
        }
        setPageItems(_page_items);
    }, [page_num, max_page]);

    const handlePageUpdate = (e) => {
        setPageNum(e.target.text);
        fetch(`/jav_browser/get_set_javs?set_type=`+jav_set_name+`&page_num=`+String(e.target.text))
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
        console.log('Change jav set to: ', event);
        setJavSet(event);
        fetch(`/jav_browser/get_set_javs?set_type=`+event+`&page_num=`+String(page_num))
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
            <div>
            <ToggleButtonGroup size="sm" type="radio" value={jav_set_name} name="pickJavSet" onChange={clickJavSetName}>
                <ToggleButton value={'most_wanted'}>most_wanted</ToggleButton>
                <ToggleButton value={'best_rated'}>best_rated</ToggleButton>
            </ToggleButtonGroup>
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
