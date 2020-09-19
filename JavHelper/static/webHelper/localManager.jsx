import React, { useState, useEffect} from 'react';
import { DebounceInput } from 'react-debounce-input';
import Pagination from 'react-bootstrap/Pagination';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import { useTranslation } from 'react-i18next';
import Bottleneck from "bottleneck";

import LocalJavCard from './localJavCard'

const LocalJavManager = (props) => {
    const { t, i18n } = useTranslation();
    const scrape_limiter = new Bottleneck({maxConcurrent: 4, minTime: 300});
    // store jav objs
    const [jav_objs, setJavObjs] = useState([]);
    const [filter_cars, setFilterCars] = useState([]);

    // page num and max page only affect when search
    const [page_num, setPageNum] = useState('1');
    const [max_page, setMaxPage] = useState('20');
    const [page_items, setPageItems] = useState();
    // search string from input bar
    const [searchString, setSearchString] = useState('');

    // shared const
    const [global_loading, setGlobalLoading] = useState(false);
    const [multi_loading_need, setMultiLoadingNeed] = useState(99);
    const [multi_loading_actual, setMultiLoadingActual] = useState([]);

    // initialize page result with unparsed javs
    useEffect(() => {
        if (props.scan_path) {
            fetch('/directory_scan/pre_scan_files?path='+props.scan_path)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    setJavObjs(jsonData['response']);
                    //console.log(jsonData['response']);
                })
        }
    }, [props.scan_path]);

    useEffect(() => {
        if (searchString) {
            fetch('/local_manager/partial_search?search_string='+searchString.toUpperCase())
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    setJavObjs(jsonData['success']);
                    //console.log(jsonData['response']);
                })
        } else if (props.scan_path) {
            // if search string is cleared, back to unparse mode
            fetch('/directory_scan/pre_scan_files?path='+props.scan_path)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    setJavObjs(jsonData['response']);
                    //console.log(jsonData['response']);
                })
        }
    }, [searchString])

    // handle paged search results
    const handlePagedSearch = () => {
        
    };

    const handleAllScrape = () => {
        setGlobalLoading(true);
        setMultiLoadingNeed(jav_objs.length);
        setMultiLoadingActual([]);

        for (var i=0; i<jav_objs.length; i++) {
            let _process_jav_obj = jav_objs[i];
            
            scrape_limiter.schedule(() => 
                fetch('/local_manager/single_scrape',
                    {method: 'post',
                    body: JSON.stringify({
                            "update_dict": _process_jav_obj
                    })})
                )
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    // return can be empty list
                    if (jsonData.success != undefined) {
                        console.log('Succeessful scraped: ', _process_jav_obj.car);
                        push_to_multi_actual(_process_jav_obj.car);
                    } else if (jsonData.errors) {
                        console.log('encounter errors: ', jsonData.errors);
                        push_to_multi_actual_failed(_process_jav_obj.car);
                    } else {
                        console.log('[FATAL ERROR] cannot scrape: ', _process_jav_obj.car);
                        push_to_multi_actual_failed(_process_jav_obj.car);
                    };
                });
        };
    };

    // this is to handle when scrape fail to get rid of spinning wheel
    function push_to_multi_actual_failed(car) {
        let _update_multi_loading = multi_loading_actual;
        //console.log(_update_multi_loading);
        _update_multi_loading.push(1);
        setMultiLoadingActual(_update_multi_loading);
    }

    function push_to_multi_actual(car) {
        let _update_multi_loading = multi_loading_actual;
        //console.log(_update_multi_loading);
        _update_multi_loading.push(1);
        setMultiLoadingActual(_update_multi_loading);

        // try remove when updating
        setFilterCars(existing_array => [...existing_array, car]);
    }

    // when filter car list change, update jav_objs
    useEffect(() => {
        if (filter_cars.length > 0){
            //console.log('filter out list: ', filter_cars);
            var filteredArray = jav_objs.filter(function(itm){
                return !(filter_cars.includes(itm.car));
            });
            setJavObjs(filteredArray);
        }
    }, [filter_cars.length])

    // update when multi loading are all set
    useEffect(() => {
        if (multi_loading_actual.length === multi_loading_need && multi_loading_need != 0) {
            //console.log('updating to false');
            setGlobalLoading(false);
            setFilterCars([]);  // reset filter car array
        } else {
            //console.log('current: ', multi_loading_need, multi_loading_actual);
        }
    }, [multi_loading_actual.length, multi_loading_need])

    const handleRemove = (car) => {
        console.log('poping: ', car);
        let _new_jav_objs = [];
        for (let jav_obj of jav_objs) {
            if (jav_obj.car === car) {

            } else {
                _new_jav_objs.push(jav_obj);
            }
        };
        setJavObjs(_new_jav_objs);
    }

    return (
        <div>
            <div style={{display: "flex"}}>
                <div>
                    <span>{t('search_car_allow_partial')}: </span>
                    <DebounceInput minLength={1} debounceTimeout={1500} onChange={e => setSearchString(e.target.value)}/>
                    {'  '}
                    <Button variant="primary" size="sm" onClick={handleAllScrape} disabled={global_loading || jav_objs.length==0}>
                        {(global_loading) ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : t('scrape_all')}
                    </Button>
                </div>
            </div>
            <div>
                <Pagination size="sm" onClick={handlePagedSearch}>{page_items}</Pagination>
            </div>
            <div>{
                jav_objs.map(function(jav_obj){
                    return (<LocalJavCard key={jav_obj.car} 
                        update_obj={jav_obj} handleRemove={handleRemove} global_loading={global_loading} 
                        setGlobalLoading={setGlobalLoading} 
                        />)
                })
            }</div>
            <div>
                <Pagination size="sm" onClick={handlePagedSearch}>{page_items}</Pagination>
            </div>
        </div>
    );
};

export default LocalJavManager;