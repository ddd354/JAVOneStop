import React, { useState, useEffect } from 'react';
import Form from "react-jsonschema-form";

import JSONInput from 'react-json-editor-ajrm';
import locale    from 'react-json-editor-ajrm/locale/zh-cn';

import { useTranslation } from 'react-i18next';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { StyledDiv } from "./styling";
import "./configurator.css"


const JavConfigurator = (props) => {
    const [oof_json, setOofJson] = useState({});
    const [javlib_cf_json, setJavlibCFJson] = useState({});
    const { t, i18n } = useTranslation();
    
    // init current 115 cookies
    useEffect(() => {
        fetch(`/directory_scan/read_oof_cookies?return_all=True`)
            .then(response => response.json())
            .then((jsonData) => {
                if (jsonData.error) {
                    console.log(jsonData.error);
                    setOofJson({});
                } else {
                    setOofJson(jsonData.oof_cookies);
                }
            });
        fetch(`/directory_scan/read_javlib_cf_cookies?return_all=True`)
            .then(response => response.json())
            .then((jsonData) => {
                if (jsonData.error) {
                  console.log(jsonData.error);
                  setJavlibCFJson({});
                } else {
                  setJavlibCFJson(jsonData.javlib_cf_cookies);
                }
            });
    }, []);

    // form for location configuration
    const settings_form_schema = {
        "type": "object",
        "required": [
          "enable_proxy"
        ],
        "properties": {
          "file_path": {
            "type": "string",
            "title": t('set_file_path_title')
          },
          "jav_obj_priority": {
            "type": "string",
            "title": t('set_jav_obj_priority')
          },
          "remove_string": {
            "type": "string",
            "title": t('set_remove_string')
          },
          "enable_proxy": {
            "type": "string",
            "title": t('set_enable_proxy_title'),
            "enum": ["是", "否"]
          },
          "preserve_subtitle_filename": {
            "type": "string",
            "title": t('preserve_subtitle_filename'),
            "enum": ["是", "否"]
          },
          "subtitle_filename_postfix": {
            "type": "string",
            "title": t('subtitle_filename_postfix')
          },
          "handle_multi_cds": {
            "type": "string",
            "title": t('handle_multi_cds'),
            "enum": ["是", "否"]
          },
          "proxy_setup": {
            "type": "string",
            "title": t('set_proxy_addr_port_title')
          },
          "emby_address": {
            "type": "string",
            "title": t('set_emby_addr_port_title')
          },
          "emby_api": {
            "type": "string",
            "title": "Emby API Key"
          },
          "javlibrary_url": {
            "type": "string",
            "title": t('set_javlib_url_title')
          },
          "aria_address": {
            "type": "string",
            "title": t('set_aria2_url_title')
          },
          "aria_port": {
            "type": "string",
            "title": t('set_aria2_port_title')
          },
          "aria_token": {
            "type": "string",
            "title": "Aria2 authentication token"
          },
          "display_language": {
            "type": "string",
            "title": t('display_language')
          },
          "ikoa_dmmc_server": {
            "type": "string",
            "title": t('set_ikoa_dmmc_server')
          },
          "db_type": {
            "type": "string",
            "title": t('db_type'),
            "enum": ["blitz", "sqlite"]
          }
        }
    };
    const settings_form_ui = {
        "file_path": {
            "ui:description": t('file_path_tip')
        },
        "enable_proxy": {
            "ui:widget": "radio"
        },
        "preserve_subtitle_filename": {
            "ui:widget": "radio"
        },
        "handle_multi_cds": {
            "ui:widget": "radio"
        },
        "emby_address": {
            "ui:description": t('emby_addr_tip'),
        },
        "db_type": {
          "ui:widget": "radio"
      },
    };

    const handleOofJsonUpdate = (event) => {
        if (event.error) {
            return 
        }
        console.log('Processing request form: ', event.json);
        //setOofFormData(event.json);  // retain submitted form data
        fetch('/directory_scan/update_oof_cookies',
            {method: 'post',
            body: JSON.stringify({
                    "update_dict": event.json
            })})
            .then(response => {
                return [response.json(), response.status];
            })
            .then((res_list) => {
                if (res_list[1] === 200) {
                    // jsonData is parsed json object received from url
                    res_list[0].then((jsonData) => {
                        //console.log(jsonData.status);
                        console.log('115 cookies updated')
                    })
                } else {
                    res_list[0].then((jsonData) => {
                        console.log(jsonData.errors.split("\n"));
                    })
                }
            });
    };

    const handleJavlibCFJsonUpdate = (event) => {
      if (event.error) {
          return 
      }
      console.log('Processing request form: ', event.json);
      //setOofFormData(event.json);  // retain submitted form data
      fetch('/directory_scan/update_javlib_cf_cookies',
          {method: 'post',
          body: JSON.stringify({
                  "update_dict": event.json
          })})
          .then(response => {
              return [response.json(), response.status];
          })
          .then((res_list) => {
              if (res_list[1] === 200) {
                  // jsonData is parsed json object received from url
                  res_list[0].then((jsonData) => {
                      //console.log(jsonData.status);
                      console.log('javlibrary cloudflare cookies updated')
                  })
              } else {
                  res_list[0].then((jsonData) => {
                      console.log(jsonData.errors.split("\n"));
                  })
              }
          });
  };

    return (
        <Tabs>
        <TabList>
            <Tab>{t('Local Config')}</Tab>
            <Tab>{t('115 Cookies Update')}</Tab>
            <Tab>{t('javlibrary cloudflare cookies')}</Tab>
        </TabList>

        <TabPanel>
            <StyledDiv>
                <Form schema={settings_form_schema} 
                    uiSchema={settings_form_ui} 
                    formData={props.settings_form_data} 
                    onSubmit={props.settingsFormHandler} 
                />
            </StyledDiv>
        </TabPanel>
        <TabPanel>
            <StyledDiv>
                <JSONInput
                    id          = 'oof_editor'
                    onChange    = {handleOofJsonUpdate}
                    local       = {locale}
                    theme       = 'dark_vscode_tribute'
                    placeholder = { oof_json }
                    width       = '80%'
                />
            </StyledDiv>
        </TabPanel>
        <TabPanel>
            <StyledDiv>
                <JSONInput
                    id          = 'javlib_cf_editor'
                    onChange    = {handleJavlibCFJsonUpdate}
                    local       = {locale}
                    theme       = 'dark_vscode_tribute'
                    placeholder = { javlib_cf_json }
                    width       = '80%'
                />
            </StyledDiv>
        </TabPanel>
        </Tabs>
)};

export default JavConfigurator;

