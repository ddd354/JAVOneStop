import React, { useState, useEffect} from 'react';
import { DebounceInput } from 'react-debounce-input';
import Pagination from 'react-bootstrap/Pagination'

import { useTranslation } from 'react-i18next';

import LocalJavCard from './localJavCard'

const LocalJavManager = (props) => {
    const { t, i18n } = useTranslation();
    const [jav_objs, setJavObjs] = useState([]);
    // page num and max page only affect when search
    const [page_num, setPageNum] = useState('1');
    const [max_page, setMaxPage] = useState('20');
    const [page_items, setPageItems] = useState();
    // search string from input bar
    const [searchString, setSearchString] = useState('');

    // initialize page result with unparsed javs
    useEffect(() => {
        fetch('/directory_scan/pre_scan_files?path='+props.scan_path)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    setJavObjs(jsonData['response']);
                    //console.log(jsonData['response']);
                })
    }, [props.scan_path]);

    // handle paged search results
    const handlePagedSearch = () => {
        
    };

    return (
        <div>
            <div style={{display: "flex"}}>
                <div>
                    <span>{t('search_car_allow_partial')}: </span>
                    <DebounceInput minLength={1} debounceTimeout={500} onChange={e => setSearchString(e.target.value)}/>
                </div>
            </div>
            <div>
                <Pagination size="sm" onClick={handlePagedSearch}>{page_items}</Pagination>
            </div>
            <div>{
                jav_objs.map(function(jav_obj){
                    return <LocalJavCard key={jav_obj.car} update_obj={jav_obj}/>
                })
            }</div>
            <div>
                <Pagination size="sm" onClick={handlePagedSearch}>{page_items}</Pagination>
            </div>
        </div>
    );
};

export default LocalJavManager;