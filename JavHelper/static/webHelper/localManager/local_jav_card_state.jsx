import { Machine, assign, sendParent } from 'xstate';

const invokeScrape = (ctx, evt) => {
    return fetch('/local_manager/single_scrape',
        {method: 'post',
        body: JSON.stringify({
                "update_dict": ctx.jav_info
        })})
    .then(response => response.json())
    .then(jsonData => jsonData.success)
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
        .then((jsonData) => jsonData.success)
}

const invokePreviewRename = (ctx, evt) => {
    return fetch('/directory_scan/preview_single_rename?file_name='+ctx.jav_info.file_name)
        .then(response => response.json())
        .then(jsonData => jsonData.success)
}

const hasFileName = (ctx, evt) => {
    let cond = Boolean(ctx.jav_info.file_name) && !ctx.jav_info.file_name.endsWith('.nfo');
    if (!cond) {
        console.log('Cannot perform ', evt.type, ' no file name to act on');
    }
    return cond
}

const createLocalJacCardState = (jav_info) => {
    return  Machine({
            id: 'indLocalJavCard',
            initial: 'show_info',
            context: {
                loading: false,
                new_file_name: '',
                jav_info
            },
            states: {
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
                scrape_db: {
                    // when enter, scrape car and update db
                    invoke: {
                        id: 'scrape-to-refresh-db',
                        src: invokeScrapeForDB,
                        onDone: {
                            target: 'show_info',
                            actions: assign((context, event) => {
                                if (event.data.car) {
                                    console.log('updating context', event.data);
                                    return {jav_info: event.data, loading: false}
                                } else {
                                    console.log('refresh db failed!')
                                }
                            })
                        },
                        onError: {
                            target: 'show_info',
                            actions: (ctx, evt) => {
                                console.log('refresh db failed!')
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
                                console.log('load preview rename failed!')
                            }
                        }
                    }
                },
                check_preview_name: {
                    // verify whether rename is actually needed
                    on: {
                        '': [
                            {
                                target: 'preview_rename', 
                                cond: (context, event) => context.jav_info.file_name != context.new_file_name
                            },
                            {
                                target: 'show_info', 
                                actions: [
                                    (ctx, evt) => {console.log(`no rename needed for ${ctx.jav_info.file_name}`)}, 
                                    assign((context, event) => { return {new_file_name: ''} })
                                ]
                            }
                        ]
                    }
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
                                (ctx, evt) => console.log(evt.data),
                                assign((context, event) => {return {new_file_name: ''}}), 
                                sendParent('REFRESH')
                            ]
                        },
                        onError: {
                            target: 'show_info',
                            actions: (ctx, evt) => {
                                console.log('rename file failed!')
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
                                (ctx, evt) => console.log(`scraped ${evt.data.car}`),
                                assign((context, event) => {return {jav_info: {}, loading: false}}),
                                sendParent('SCRAPE_COMPLETE')
                            ]
                        },
                        onError: {
                            target: 'show_info',
                            actions: [sendParent('SCRAPE_COMPLETE'), (ctx, evt) => console.log('single error: ', evt.data)]
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