import { Machine, assign, sendParent, actions } from 'xstate';

const { pure } = actions;

const invokeScrape = (ctx, evt) => {
    return fetch('/local_manager/single_scrape',
        {method: 'post',
        body: JSON.stringify({
                "update_dict": ctx.jav_info
        })})
    .then(response => response.json())
    .then(jsonData => {
        if (jsonData.success) {
            return jsonData.success
        } else {
            throw `${ctx.jav_info.file_name} \n ${jsonData.error}`
        }
    })
}

const invokeScrapeForDB = (ctx, evt) => {
    //console.log('scrape for db', ctx, evt);
    return fetch('/local_manager/find_images?car='+evt.data)
        .then(response => response.json())
        .then((jsonData) => jsonData.success);
}

const invokeRename = (ctx, evt) => {
    let post_obj = ctx.jav_info;
    post_obj['new_file_name'] = ctx.new_file_name;

    return fetch('/directory_scan/rename_single_file',
        {method: 'post',
        body: JSON.stringify({
                "file_obj": post_obj
        })})
        .then(response => response.json())
        .then((jsonData) => {
            console.log(jsonData.success.msg);
            return jsonData.success.old_file_name
        })
}

const invokePreviewRename = (ctx, evt) => {
    return fetch('/directory_scan/preview_single_rename?file_name='+ctx.jav_info.file_name)
        .then(response => response.json())
        .then(jsonData => jsonData.success)
}

const invokeWriteNfoFile = (ctx, evt) => {
    return fetch('/local_manager/rewrite_nfo',
                    {method: 'post',
                    body: JSON.stringify({
                            "update_dict": ctx.jav_info
                    })})
            .then(response => response.json())
}

const invokeWriteImageFile = (ctx, evt) => {
    return fetch('/local_manager/rewrite_images',
                    {method: 'post',
                    body: JSON.stringify({
                            "update_dict": ctx.jav_info
                    })})
            .then(response => response.json())
}

const hasFileName = (ctx, evt) => {
    let cond = Boolean(ctx.jav_info.file_name) && !ctx.jav_info.file_name.endsWith('.nfo');
    /*if (!cond) {
        console.log('Cannot perform ', evt.type, ' no file name to act on');
    }*/
    return cond
}

const overwriteJavInfo = (input_dict, jav_info) => {
    //console.log('input dict ', input_dict)
    jav_info[input_dict['key']] = input_dict['value']
    //console.log('updated ', jav_info)
    return jav_info
}

const createLocalJacCardState = (jav_info, t) => {
    return  Machine({
            id: 'indLocalJavCard',
            initial: 'initialize',
            context: {
                loading: false,
                new_file_name: '',
                t,
                jav_info
            },
            states: {
                initialize: {
                    always: [
                        {
                            target: 'db_result', 
                            cond: (context, event) => context.jav_info.directory
                        },
                        {
                            // by default we use show_info
                            target: 'show_info'
                        }
                    ]
                },
                db_result: {
                    on: {
                        SCRAPE_DB: {
                            // scrape for db, must have a car to start
                            target: 'scrape_db_result',
                            cond: (ctx, evt) => {return Boolean(ctx.jav_info.car)},
                            actions: assign((ctx, evt) => {
                                return {loading: true}
                            }),
                        },
                        WRITE_NFO: {
                            target: 'write_nfo',
                            actions: assign((ctx, evt) => {
                                return {loading: true}
                            }),
                        },
                        WRITE_IMAGE: {
                            target: 'write_image',
                            actions: assign((ctx, evt) => {
                                return {loading: true}
                            }),
                        },
                        OVERWRITE_JAV_INFO: {
                            target: 'db_result',
                            actions: assign((ctx, evt) => {
                                return {jav_info: overwriteJavInfo(evt.update_dict, ctx.jav_info)}
                            })
                        }
                    }
                },
                write_nfo: {
                    invoke: {
                        id: 'write-nfo-to-file',
                        src: invokeWriteNfoFile,
                        onDone: {
                            target: 'db_result',
                            actions: assign((ctx, evt) => {
                                //console.log('ok', ctx, evt)
                                if (evt.data.success === undefined) {
                                    console.log(evt.data.error)
                                } else {
                                    console.log(ctx.t('nfo_write_ok'), ctx.jav_info.car)
                                }
                                return {loading: false}
                            }),
                        }
                    }
                },
                write_image: {
                    invoke: {
                        id: 'write-image-to-file',
                        src: invokeWriteImageFile,
                        onDone: {
                            target: 'db_result',
                            actions: assign((ctx, evt) => {
                                //console.log('ok', ctx, evt)
                                if (evt.data.success === undefined) {
                                    console.log(evt.data.error)
                                } else {
                                    console.log(t('image_write_ok'), ctx.jav_info.car)
                                }
                                return {loading: false}
                            }),
                        }
                    }
                },
                show_info: {
                    on: {
                        SCRAPE_DB: {
                            // scrape for db, must have a car to start
                            target: 'scrape_db',
                            cond: (ctx, evt) => {return Boolean(ctx.jav_info.car)},
                            actions: assign((ctx, evt) => {
                                return {loading: true}
                            }),
                        },
                        SCRAPE: {
                            target: 'scrape',
                            actions: assign((ctx, evt) => {
                                return {loading: true}
                            }),
                            cond: hasFileName
                        },
                        PREVIEW_RENAME: {
                            target: 'load_preview_rename',
                            cond: hasFileName
                        },
                        FORCE_RENAME: {
                            target: 'preview_rename',
                            actions: assign((ctx, evt) => {return {new_file_name: ctx.jav_info.file_name}}),
                            cond: hasFileName
                        }
                    }
                },
                scrape_db_result: {
                    // when enter, scrape car and update db
                    invoke: {
                        id: 'scrape-to-refresh-db',
                        src: invokeScrapeForDB,
                        onDone: {
                            target: 'db_result',
                            actions: assign((context, event) => {
                                if (event.data.car) {
                                    //console.log('updating context', event.data);
                                    return {jav_info: event.data, loading: false}
                                } else {
                                    console.log(context.t('refresh_db_fail'))
                                }
                            })
                        },
                        onError: {
                            target: 'db_result',
                            actions: (ctx, evt) => {
                                console.log(ctx.t('refresh_db_fail'))
                            }
                        }
                    }
                },
                scrape_db: {
                    // when enter, scrape car and update db
                    invoke: {
                        id: 'scrape-to-refresh-db',
                        src: invokeScrapeForDB,
                        onDone: {
                            target: 'show_info',
                            actions: assign((context, event) => {
                                if (event.data.car) {
                                    //console.log('updating context', event.data);
                                    return {jav_info: event.data, loading: false}
                                } else {
                                    console.log(context.t('refresh_db_fail'))
                                }
                            })
                        },
                        onError: {
                            target: 'show_info',
                            actions: (ctx, evt) => {
                                console.log(ctx.t('refresh_db_fail'))
                            }
                        }
                    }
                },
                load_preview_rename: {
                    // when enter, get new filename for preview
                    invoke: {
                        id: 'load-preview-rename',
                        src: invokePreviewRename,
                        onDone: {
                            target: 'check_preview_name',
                            actions: assign((context, event) => {
                                //console.log('load preview rename', event.data);
                                return {new_file_name: event.data}
                            })
                        },
                        onError: {
                            target: 'show_info',
                            actions: (ctx, evt) => {
                                console.log(ctx.t('preview_name_fail'))
                            }
                        }
                    }
                },
                check_preview_name: {
                    // verify whether rename is actually needed
                    always: [
                        {
                            target: 'preview_rename', 
                            cond: (context, event) => context.jav_info.file_name != context.new_file_name
                        },
                        {
                            target: 'show_info', 
                            actions: [
                                //(ctx, evt) => {console.log(`no rename needed for ${ctx.jav_info.file_name}`)}, 
                                assign((context, event) => { return {new_file_name: ''} })
                            ]
                        }
                    ]
                },
                preview_rename: {
                    on: {
                        UP_PREVIEW_NAME: {
                            target: 'preview_rename',
                            actions: assign((ctx, evt) => {
                                return {new_file_name: evt.data}
                            })
                        },
                        RENAME: {
                            target: 'rename'
                        },
                        BACK_INFO: {
                            target: 'show_info',
                            actions: assign((ctx, evt) => {return {new_file_name: ''}})
                        }
                    }
                },
                rename: {
                    // when enter, rename the file
                    invoke: {
                        id: 'rename-file',
                        src: invokeRename,
                        onDone: {
                            target: 'show_info',
                            actions: [
                                //(ctx, evt) => console.log('rename complete, old name: ', evt.data),
                                assign((ctx, evt) => {return {new_file_name: ''}}),
                                pure((ctx, evt) => sendParent({type: 'RENAME_REFRESH', data: evt.data})),
                            ]
                        },
                        onError: {
                            target: 'show_info',
                            actions: (ctx, evt) => {
                                console.log(ctx.t('rename_fail_msg'), ctx.jav_info.file_name)
                            }
                        }
                    }
                },
                scrape:{
                    // when enter, scrape given file
                    invoke: {
                        id: 'scrape-file',
                        src: invokeScrape,
                        onDone: {
                            target: 'finish',
                            actions: [
                                (ctx, evt) => console.log(ctx.t('good_scrape'), evt.data.car),
                                assign((context, event) => {return {jav_info: {}, loading: false}}),
                                pure((ctx, evt) => sendParent({type: 'SCRAPE_COMPLETE', data: evt.data})),
                            ]
                        },
                        onError: {
                            // when scrape fail, it goes into finish state as well
                            // will re-appear when refreshing 
                            target: 'finish',
                            actions: [
                                (ctx, evt) => console.log(ctx.t('fail_scrape'), evt.data),
                                assign((context, event) => {return {jav_info: {}, loading: false}}),
                                pure((ctx, evt) => sendParent({type: 'SCRAPE_COMPLETE', data: evt.data})),
                            ]
                        }
                    }
                },
                finish: {

                }
            }
        }, {
            guards: {
                hasFileName
            }
        });
}

export default createLocalJacCardState