import React, { Component } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

import StatButtonGroup from "./statButtonGroup";
import JavTable from "./javTable";
import './javlibBrowser.css';

export default class JavlibBroswer extends Component {
    constructor(props) {
        // Required step: always call the parent class' constructor
        super(props);

        this.state = {
            jav_objs: [],
            page_num: 1,
            more_item: true
        };
        this.moreJavHandler = this.moreJavHandler.bind(this);
        this.updateStatOnIndex = this.updateStatOnIndex.bind(this);
    }

    componentDidMount () {
        // initialize jav obj
        fetch(`/jav_browser/get_set_javs?set_type=most_wanted`)
            .then(response => response.json())
            .then((jsonData) => {
                console.log(jsonData.success);
                this.setState({ jav_objs: jsonData.success, page_num: this.state.page_num+1 });
                if (jsonData.errors) {
                    console.log(jsonData.error);
                }
            })
    }

    moreJavHandler() {
        fetch(`/jav_browser/get_set_javs?set_type=most_wanted&page_num=`+String(this.state.page_num))
            .then(response => response.json())
            .then((jsonData) => {
                console.log(jsonData.success);
                this.setState({ jav_objs: this.state.jav_objs.concat(jsonData.success), page_num: this.state.page_num+1 });
                if (jsonData.errors) {
                    console.log(jsonData.error);
                }
            })
    }

    updateStatOnIndex(index, stat) {
        let current_objs = this.state.jav_objs;
        current_objs[index]['stat'] = stat;
        this.setState({jav_objs: current_objs});
    }

    render() {
        return (
            <InfiniteScroll
                dataLength={this.state.jav_objs.length}
                next={this.moreJavHandler}
                hasMore={true}
                loader={<h4>Loading...</h4>}
                scrollThreshold={1}
            >
                {this.state.jav_objs.map((jav_obj, index) => {
                    let border_style = {
                            borderColor: 'green', 
                            borderWidth: '1px', 
                            borderStyle: 'solid',
                            marginBottom: '20px'
                        };
                    if (jav_obj.directory) {
                        border_style.borderColor = 'red';
                    }
                    
                    return (
                        <div className="flex-container" style={border_style} key={jav_obj.javid}>
                            <div className="jav-image"><img style={{opacity: 0.1}} src={"https:"+jav_obj.img}></img></div>
                            <div className="jav-content">
                                <p>{jav_obj.title}</p>
                                <StatButtonGroup stat={jav_obj.stat} car={jav_obj.car}/>
                                <JavTable car={jav_obj.car} 
                                        index={index} 
                                        stat={jav_obj.stat} 
                                        setJavStat={this.updateStatOnIndex}
                                />
                            </div>
                        </div>
                    )
                }
                )}
            </InfiniteScroll>
        );
    } 
    
};
