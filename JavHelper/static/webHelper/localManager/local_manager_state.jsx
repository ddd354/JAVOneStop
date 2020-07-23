import { Machine, assign, spawn, send, actions } from 'xstate';

import createLocalJacCardState from './local_jav_card_state'

const invokeSetScanDirectory = () => {
    return fetch('/local_manager/directory_path')
        .then(response => response.json())
        .then(jsonData => jsonData.success)
}

const invokeScanDirectory = () => {
    return fetch('/directory_scan/pre_scan_files')
        .then(response => response.json())
        .then(jsonData => jsonData.response)
}

const invokeSearchDB = (ctx, evt) => {
    let search_str = evt.data;
    return fetch('/local_manager/partial_search?search_string='+search_str.toUpperCase())
        .then(response => response.json())
        .then((jsonData) => jsonData['success'])
}

const { pure } = actions;

export const localManagerState = Machine({
    id: 'topLocalManager',
    initial: 'set_path',
    context: {
        scan_path: '',
        show_list: [],
        loading: true,
    },
    states: {
        set_path: {
            invoke: {
                id: 'set-scan-path',
                src: invokeSetScanDirectory,
                onDone:  {
                    target: 'scan_directory',
                    actions: assign((context, event) => {
                        return {scan_path: event.data, show_list: [], loading: true}
                    })
                },
                onError: {
                    target: 'show_directory'
                }
            }
        },
        scan_directory: {
            // when enter, scan directory and render
            invoke: {
                id: 'scan-directory',
                src: invokeScanDirectory,
                onDone: {
                    target: 'show_directory',
                    actions: assign((context, event) => { 
                        //console.log(event);
                        let show_list = context.show_list;
                        let _car_list = show_list.map(x => x.car);

                        event.data.forEach(jav_obj => {
                            if (!_car_list.includes(jav_obj.car)) {
                                show_list.push({
                                    car: jav_obj.car,
                                    file_name: jav_obj.file_name,
                                    machine: spawn(createLocalJacCardState(jav_obj))
                                })
                            }
                        })

                        return {show_list: show_list, loading: false}
                    })
                },
                onError: {
                    target: 'show_directory'
                }
            }
        },
        show_directory: {
            on: {
                RENAME_REFRESH: {
                    target: 'scan_directory',
                    actions: assign((ctx, evt) => {
                        //console.log('deleting: ', evt);
                        return {show_list: ctx.show_list.filter((x) => {
                            return x.file_name != evt.data
                        })}
                    })
                },
                BATCH_PREVIEW_RENAME: {
                    target: 'show_directory',
                    actions: pure((ctx, evt) => {
                        return ctx.show_list.map((ind_card) => {
                            return send('PREVIEW_RENAME', {to: ind_card.machine})
                        })
                    })
                },
                BATCH_RENAME: {
                    target: 'set_path',
                    actions: [
                        pure((ctx, evt) => {
                            return ctx.show_list.map((ind_card) => {
                                return send('RENAME', {to: ind_card.machine})
                            })
                        })
                    ]
                },
                BATCH_SCRAPE: {
                    target: 'has_scrape_task',
                    actions: [
                        (ctx, evt) => console.log('start batch scrape'),
                        assign({loading: true})
                    ]
                },
                SEARCH_DB: {
                    target: 'searching',
                    actions: [
                        (ctx, evt) => console.log('searching db'),
                        assign({loading: true})
                    ]
                }
            }
        },
        searching: {
            invoke: {
                id: 'search-db',
                src: invokeSearchDB,
                onDone:  {
                    target: 'show_directory',
                    actions: assign((context, event) => { 
                        let show_list = [];

                        event.data.forEach(jav_obj => {
                            show_list.push({
                                car: jav_obj.car,
                                machine: spawn(createLocalJacCardState(jav_obj))
                            })
                        })

                        return {show_list: show_list, loading: false}
                    })
                },
                onError: {
                    target: 'show_directory',
                    actions: [
                        (ctx, evt) => console.log('search db failed'),
                        assign({loading: false})
                    ]
                }
            }
        },
        has_scrape_task: {
            always: [
                {target: 'scrape', cond: (context, event) => context.show_list.length > 0},
                {target: 'scan_directory'}
            ]
        },
        scrape: {
            // based on incoming event jav_obj data, scrape accordingly
            always: {
                target: 'wait_for_complete',
                actions: pure((context, event) => {
                    //console.log('send SCRAPE to ', context.show_list[0].machine);
                    return send('SCRAPE', {to: context.show_list[0].machine})
                })
            }
        },
        wait_for_complete: {
            on: {
                SCRAPE_COMPLETE: {
                    target: 'has_scrape_task',
                    actions: assign({show_list: (context, event) => context.show_list.slice(1)})  // get rid of first item
                }
            }
        },
    },
    on: {
        RESCAN: {target: '.set_path'},
    }
});