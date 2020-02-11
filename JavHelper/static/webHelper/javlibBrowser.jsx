import React, { useState, useEffect } from 'react';
import Pagination from 'react-bootstrap/Pagination'

import StatButtonGroup from "./statButtonGroup";
import JavTable from "./javTable";
import './javlibBrowser.css';


const JavlibBroswer = () => {
    const [jav_objs, setJavObjs] = useState([]);
    const [page_num, setPageNum] = useState('1');
    const [page_items, setPageItems] = useState();
    const [scroll_items, setScrollItems] = useState();

    // initialize component
    useEffect(() => {
        fetch(`/jav_browser/get_set_javs?set_type=most_wanted`)
            .then(response => response.json())
            .then((jsonData) => {
                if (jsonData.error) {
                    //console.log(jsonData.error);
                    setJavObjs([]);
                } else {
                    //console.log(jsonData.success);
                    setJavObjs(jsonData.success);
                }
            });
    }, []);

    useEffect(() => {
        let _page_items = [];
        for (let number = 1; number <= 20; number++) {
            _page_items.push(
              <Pagination.Item key={number} active={String(number) === page_num}>
                {number}
              </Pagination.Item>,
            );
        }
        setPageItems(_page_items);
    }, [page_num]);

    useEffect(() => {
        setScrollItems([]);
        let _scroll_items = [];
        jav_objs.forEach((jav_obj, index) => {
            let border_style = {
                borderColor: 'green', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(51, 204, 51, 0.2)',
            };
            if (jav_obj.directory) {
                border_style.borderColor = 'red';
                border_style.background = 'rgba(255, 0, 0, 0.2)';
            } else if (jav_obj.stat === 4) {
                border_style.borderColor = 'black';
                border_style.background = 'rgba(0, 0, 0, 0.2)';
            } else if (jav_obj.stat === 2) {
                border_style.borderColor = 'yellow';
                border_style.background = 'rgba(255, 255, 0, 0.2)';
            }

            if (jav_obj.stat === 0) {
                _scroll_items.push(
                    <div className="flex-container" style={border_style} key={jav_obj.javid}>
                        <div className="jav-image"><img style={{opacity: 0.7}} src={"https:"+jav_obj.img}></img></div>
                        <div className="jav-content">
                            <p>{jav_obj.title}</p>
                            <StatButtonGroup stat={jav_obj.stat} car={jav_obj.car}/>
                            <div className="magnetTable">
                                <JavTable
                                    car={jav_obj.car} 
                                    index={index} 
                                    stat={jav_obj.stat} 
                                    setJavStat={updateStatOnIndex}
                                />
                            </div>
                        </div>
                    </div>);
            } else {
                _scroll_items.push(
                    <div className="flex-container" style={border_style} key={jav_obj.javid}>
                        <div className="jav-image"><img style={{opacity: 0.7}} src={"https:"+jav_obj.img}></img></div>
                        <div className="jav-content">
                            <p>{jav_obj.title}</p>
                            <StatButtonGroup stat={jav_obj.stat} car={jav_obj.car}/>
                            <div className="magnetTable">
                            </div>
                        </div>
                    </div>);
            }
        });
        setScrollItems(_scroll_items);
    }, [jav_objs]); 

    const forceUpdateDivs = () => {
        //console.log('force scroll update');
        let _scroll_items = [];
        jav_objs.forEach((jav_obj, index) => {
            let border_style = {
                borderColor: 'green', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                marginBottom: '20px',
                background: 'rgba(51, 204, 51, 0.2)',
            };
            if (jav_obj.directory) {
                border_style.borderColor = 'red';
                border_style.background = 'rgba(255, 0, 0, 0.2)';
            } else if (jav_obj.stat === 4) {
                border_style.borderColor = 'black';
                border_style.background = 'rgba(0, 0, 0, 0.2)';
            } else if (jav_obj.stat === 2) {
                border_style.borderColor = 'yellow';
                border_style.background = 'rgba(255, 255, 0, 0.2)';
            }
            
            if (jav_obj.stat === 0) {
                _scroll_items.push(
                    <div className="flex-container" style={border_style} key={jav_obj.javid}>
                        <div className="jav-image"><img style={{opacity: 0.7}} src={"https:"+jav_obj.img}></img></div>
                        <div className="jav-content">
                            <p>{jav_obj.title}</p>
                            <StatButtonGroup stat={jav_obj.stat} car={jav_obj.car}/>
                            <div className="magnetTable">
                                <JavTable
                                    car={jav_obj.car} 
                                    index={index} 
                                    stat={jav_obj.stat} 
                                    setJavStat={updateStatOnIndex}
                                />
                            </div>
                        </div>
                    </div>);
            } else {
                _scroll_items.push(
                    <div className="flex-container" style={border_style} key={jav_obj.javid}>
                        <div className="jav-image"><img style={{opacity: 0.7}} src={"https:"+jav_obj.img}></img></div>
                        <div className="jav-content">
                            <p>{jav_obj.title}</p>
                            <StatButtonGroup stat={jav_obj.stat} car={jav_obj.car}/>
                            <div className="magnetTable">
                            </div>
                        </div>
                    </div>);
            }
        });
        setScrollItems(_scroll_items);
    }

    const handlePageUpdate = (e) => {
        setPageNum(e.target.text);
        fetch(`/jav_browser/get_set_javs?set_type=most_wanted&page_num=`+String(e.target.text))
            .then(response => response.json())
            .then((jsonData) => {
                //console.log(jsonData.success);
                setJavObjs(jsonData.success);
                if (jsonData.errors) {
                    console.log('Error: ', jsonData.error);
                }
            })
    };

    const updateStatOnIndex = (index, stat) => {
        let current_objs = jav_objs;
        current_objs[index]['stat'] = stat;
        setJavObjs(current_objs);
        forceUpdateDivs();
    };

    return (
        <div>
            <div>
                <Pagination size="sm" onClick={handlePageUpdate}>{page_items}</Pagination>
            </div>
            <div>{scroll_items}</div>
            <div>
                <Pagination size="sm" onClick={handlePageUpdate}>{page_items}</Pagination>
            </div>
        </div>
    );
};

export default JavlibBroswer;
