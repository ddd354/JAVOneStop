import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";

import ndjsonStream from 'can-ndjson-stream';

import { Hook, Console, Decode } from 'console-feed'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
//import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Button from '@material-ui/core/Button';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'

import { withTranslation } from 'react-i18next';
import i18n from './i18n';

import IdmmMonitor from "./idmm_download"
import JavConfigurator from "./configurator"
import JavBroswerV2 from "./javBrowserV2"
import { StyledDiv, StyledLogDiv } from "./styling";
import './webHelper.css'
import HelpDoc from "./HelpDoc"
import LocalManager from './localManager/local_manager_app'

class App extends Component {
    constructor(props) {
        // Required step: always call the parent class' constructor
        super(props);

        this.state = {
          file_table_header: [],
          files_table: [],
          form_data: {},
          settings_form_data: {},
          logs: [],
          language: 'cn'
        };
        this.filePathHandler = this.filePathHandler.bind(this);
        this.embyImageHandler = this.embyImageHandler.bind(this);
        this.settingsFormHandler = this.settingsFormHandler.bind(this);
        this.changeLanguage = this.changeLanguage.bind(this);
    }

    async componentDidMount () {
        // init log window
        Hook(window.console, log => {
          this.setState(({ logs }) => ({ logs: [Decode(log), ...logs] }))
        })
        console.log('initialized');
        // load ini from file
        fetch(`/directory_scan/read_local_ini?filter_dict={
            'aria_address': ["Aria2设置", "Aria2地址"],
            'aria_port': ["Aria2设置", "Aria2端口"],
            'aria_token': ["Aria2设置", "Aria2 Token"],
            'file_path': ["本地设置", "默认填入目录"],
            'enable_proxy':['代理','是否使用代理？'],
            'proxy_setup':['代理','代理IP及端口'],
            'emby_address':['emby专用','网址'],
            'emby_api':['emby专用','API ID'],
            'javlibrary_url':['其他设置','javlibrary网址'],
            'preserve_subtitle_filename': ["本地设置", '保留中文字幕文件名'],
            'subtitle_filename_postfix': ["本地设置", '中文字幕文件名后缀'],
            'handle_multi_cds': ["本地设置", '自动处理多CD'],
            'display_language': ["其他设置", "界面语言(cn/en)"],
            'jav_obj_priority': ['其他设置', '刮削信息优先度'],
            'remove_string': ["重命名影片", "移除字符"],
            'ikoa_dmmc_server': ["其他设置", "ikoa_dmmc"],
            'db_type': ["其他设置", "数据库类型"]
            }`)
            .then(response => response.json())
            .then((jsonData) => {
              if (jsonData.error != undefined && jsonData.error.length > 0) {
                console.log(this.props.t('log_error'), jsonData.error);
              }
              //console.log('Using local config: ', jsonData.local_config);
              this.setState({ settings_form_data: jsonData.local_config, 
                form_data: jsonData.local_config, 
                language: jsonData.local_config.display_language,
              });
              i18n.changeLanguage(jsonData.local_config.display_language);
            })
    }

    filePathHandler (fileForm) {
        console.log('Processing request form: ', fileForm);
        this.setState({form_data: fileForm.formData});  // retain submitted form data
        if (fileForm.formData.action === 'preview') {
            fetch('/directory_scan/pre_scan_files?path='+fileForm.formData.file_path)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    this.setState({files_table: jsonData['response'], file_table_header: jsonData['header']});
                    if (jsonData['response'].length === 0) {
                        console.log(fileForm.formData.file_path+' scan does not reveal any file');
                    }
                })
        } else if (fileForm.formData.action === 'parse_jav') {
            console.log('start parse on: '+fileForm.formData.file_path);
            fetch('/parse_jav/parse_unprocessed_folder?path='+fileForm.formData.file_path)  // make a fetch request to a NDJSON stream service
              .then((response) => {
                return ndjsonStream(response.body); //ndjsonStream parses the response.body
            }).then((exampleStream) => {
                let read;
                let exampleRead = exampleStream.getReader();
                exampleRead.read().then(read = (result) => {
                    if (result.done) {
                        return;
                    }
                    console.log(result.value.log);

                    exampleRead.read().then(read); //recurse through the stream
                });
            });
        } else if (fileForm.formData.action === 'preview_rename') {
            fetch('/directory_scan/rename_path_preview?path='+fileForm.formData.file_path)
                .then(response => response.json())
                .then((jsonData) => {
                    // jsonData is parsed json object received from url
                    this.setState({files_table: jsonData['response'], file_table_header: jsonData['header']});
                })
        } else if (fileForm.formData.action === 'rename') {
            fetch('/directory_scan/rename_path_on_json',
                {method: 'post',
                body: JSON.stringify({
                        "path": fileForm.formData.file_path,
                        "file_objs": this.state.files_table
                   })
                })  // make a fetch request to a NDJSON stream service
              .then((response) => {
                return ndjsonStream(response.body); //ndjsonStream parses the response.body
            }).then((exampleStream) => {
                let read;
                let exampleRead = exampleStream.getReader();
                exampleRead.read().then(read = (result) => {
                    if (result.done) {
                        return;
                    }
                    //console.log(result.value);
                    console.log(result.value.log);

                    exampleRead.read().then(read); //recurse through the stream
                });
            });
        }
    }

    embyImageHandler () {
        try {
            console.log('working on the emby image update');
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
                    console.log(result.value.log);
                    exampleRead.read().then(read); //recurse through the stream
                });
            });
        } catch(err) {
            console.error(`Error: ${err}`);
        }
    }

    settingsFormHandler (settingsForm) {
        console.log('Processing request form: ', settingsForm);
        this.setState({settings_form_data: settingsForm.formData});  // retain submitted form data
        fetch('/directory_scan/update_local_ini',
            {method: 'post',
            body: JSON.stringify({
                    "update_dict": settingsForm.formData
            })})
            .then(response => {
                return [response.json(), response.status];
            })
            .then((res_list) => {
                if (res_list[1] === 200) {
                    // jsonData is parsed json object received from url
                    res_list[0].then((jsonData) => {
                        console.log(jsonData.status);
                    })
                } else {
                    res_list[0].then((jsonData) => {
                        console.log(jsonData.errors.split("\n"));
                    })

                }
            });
    }

    changeLanguage (lng) {
      // update ini file
      fetch('/directory_scan/update_local_ini',
        {method: 'post',
        body: JSON.stringify({
                "update_dict": {display_language: lng}
        })})
        .then(response => {
            return [response.json(), response.status];
        })
        .then((res_list) => {
            if (res_list[1] === 200) {
                //console.log(res_list);
                this.setState({language: lng})
                i18n.changeLanguage(lng);
            } else {
                res_list[0].then((jsonData) => {
                    console.log(jsonData.errors.split("\n"));
                })

            }
        });
    }

    render() {
        const { t } = this.props;
        const form_schema = {
          "type": "object",
          "required": [
            "file_path",
            "action"
          ],
          "properties": {
            "file_path": {
              "type": "string",
              "title": t('form_file_path_title')
            },
            "action": {
              "type": "string",
              "title": t('form_action_title'),
              "enum": ["preview", "preview_rename", "rename"]
            },
          }
        };

        const form_ui = {
            "file_path": {
              "ui:description": t('form_file_path_des'),
              "ui:autofocus": true
            },
            "action": {
              "ui:widget": "radio",
              "ui:description": t('form_action_des'),
              "ui:emptyValue": "preview"
            },
        };

        return (
          <Router>
          <Container fluid>
            <Row className='javConsoleContainer'><Col id="consoleColumn">
              <StyledLogDiv className='javConsole'>
                <Console logs={this.state.logs} filter={['log', 'error']} variant="dark" />
              </StyledLogDiv>
            </Col></Row>
            <Row><Col>
              <Row><Col>
              <NavTab exact to="/">{t('helper_page')}</NavTab>
              <NavTab to="/p/javbroswer">{t('JavLibrary Manager')}</NavTab>
              <NavTab to="/p/localmanager">{t('Main Tool')}</NavTab>
              <NavTab to="/p/handytools">{t('Handy Features')}</NavTab>
              <NavTab to="/p/configure">{t('Settings')}</NavTab>
              </Col></Row>

              <Row><Col>
              <Switch>
                <Route exact path="/">
                  <ToggleButtonGroup type="radio" name='language' value={this.state.language} onChange={this.changeLanguage}>
                    <ToggleButton value={'cn'}>中文</ToggleButton>
                    <ToggleButton value={'en'}>English</ToggleButton>
                  </ToggleButtonGroup>
                  <HelpDoc />
                </Route>
                <Route path="/p/javbroswer" component={JavBroswerV2} />
                <Route exact path="/p/localmanager" component={LocalManager} />
                <Route exact path="/p/handytools">
                  <Button variant="outlined" color="primary" onClick={this.embyImageHandler}>{t('Upload actress images to Emby')}</Button>
                  <IdmmMonitor server_addr={this.state.settings_form_data.ikoa_dmmc_server} />
                </Route>
                <Route exact path="/p/configure">
                  <JavConfigurator settings_form_data={this.state.settings_form_data} settingsFormHandler={this.settingsFormHandler}/>
                </Route>
              </Switch>
              </Col></Row>

            </Col></Row>
          </Container>
          </Router>
          )
        }
}

export default withTranslation()(App);