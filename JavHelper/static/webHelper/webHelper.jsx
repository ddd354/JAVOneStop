import React, { Component } from "react";
import ndjsonStream from 'can-ndjson-stream';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Form from "react-jsonschema-form";
import Button from '@material-ui/core/Button';

import FileTable from "./fileTable";
import { StyledDiv, StyledLogDiv } from "./styling";


export default class App extends Component {
    constructor(props) {
        // Required step: always call the parent class' constructor
        super(props);

        this.state = {
          files_table: [],
          ui_log: ['Front end loaded']
        };
        this.filePathHandler = this.filePathHandler.bind(this);
        this.embyImageHandler = this.embyImageHandler.bind(this);
    }

    filePathHandler (fileForm) {
        console.log(fileForm);
        if (fileForm.formData.parse === false) {
            fetch('/directory_scan/pre_scan_files?path='+fileForm.formData.filepath)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    console.log(jsonData);
                    this.setState({files_table: jsonData['response']});
                })
        } else {
            console.log('start parse on'+fileForm.formData.filepath);
            fetch('/parse_jav/parse_unprocessed_folder?path='+fileForm.formData.filepath)  // make a fetch request to a NDJSON stream service
              .then((response) => {
                return ndjsonStream(response.body); //ndjsonStream parses the response.body
            }).then((exampleStream) => {
                let read;
                let exampleRead = exampleStream.getReader();
                exampleRead.read().then(read = (result) => {
                    if (result.done) {
                        return;
                    }
                    console.log(result.value);
                    let new_log = this.state.ui_log.concat(result.value.success);
                    this.setState({ ui_log: new_log });

                    exampleRead.read().then(read); //recurse through the stream
                });
            });
        }
    }

    embyImageHandler () {
        try {
            console.log('working on the requests');
            fetch('/emby_actress/set_actress_images')  // make a fetch request to a NDJSON stream service
              .then((response) => {
                return ndjsonStream(response.body); //ndjsonStream parses the response.body
            }).then((exampleStream) => {
                let read;
                let exampleRead = exampleStream.getReader();
                exampleRead.read().then(read = (result) => {
                    if (result.done) {
                        return;
                    }
                    console.log(result.value);
                    let new_log = [result.value.log, ...this.state.ui_log];
                    this.setState({ ui_log: new_log });

                    exampleRead.read().then(read); //recurse through the stream
                });
            });
            /*fetch('/emby_actress/set_actress_images')
                .then(res => res.json())
                .then(function(res_json) {console.log(JSON.stringify(res_json))});*/
        } catch(err) {
            console.error(`Error: ${err}`);
        }
    }

    render() {
        const form_schema = {
          "type": "object",
          "required": [
            "filepath",
            "parse"
          ],
          "properties": {
            "filepath": {
              "type": "string",
              "title": "File Path",
              "default": "/Volumes/XER/X-emby"
            },
            "parse": {
              "type": "boolean",
              "title": "parse files: ",
              "default": false
            },
          }
        };

        const form_ui = {
            "filepath": {
              "ui:description": "Type in path (Due to restriction of the front end, user has to manually input directory)",
              "ui:autofocus": true,
            },
            "parse": {
              "ui:widget": "radio"
            },
        };

        return (
            <div>
            <StyledLogDiv><ul>{this.state.ui_log.map(i => <li>{i}</li>)}</ul></StyledLogDiv>
            <Tabs>
            <TabList>
              <Tab>Main Tool</Tab>
              <Tab>Handy Features</Tab>
              <Tab>Settings</Tab>
            </TabList>

            <TabPanel>
                <StyledDiv>
                <Form schema={form_schema} uiSchema={form_ui} onSubmit={this.filePathHandler}>
                    <div>
                      <button type="submit">Preview File / Execute</button>
                    </div>
                </Form>
                </StyledDiv>
                <FileTable file_data={this.state.files_table}/>
            </TabPanel>
            <TabPanel>
              <Button variant="outlined" color="primary" onClick={this.embyImageHandler}>Upload actress images to Emby</Button>
            </TabPanel>
            <TabPanel>
              <h2>Any content 2</h2>
            </TabPanel>
            </Tabs>
            </div>
           )
        }
}