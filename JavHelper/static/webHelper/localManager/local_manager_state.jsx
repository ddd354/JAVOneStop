import { Machine, assign } from 'xstate';

const invokeJavScrape = (jav_obj) => {
    console.log('received scrape: ', jav_obj);
    
    return fetch('/local_manager/single_scrape',
        {method: 'post',
        body: JSON.stringify({
                "update_dict": jav_obj
        })})
    .then(response => response.json())
    .then((jsonData) => {
        // jsonData is parsed json object received from url
        // return can be empty list
        if (jsonData.success != undefined) {
            console.log('Succeessful scraped: ', jav_obj.car);
        } else if (jsonData.errors) {
            console.log('encounter errors: ', jsonData.errors);
        } else {
            console.log('[FATAL ERROR] cannot scrape: ', jav_obj.car);
        };
    });
}

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

export const localManagerState = Machine({
    id: 'topLocalManager',
    initial: 'set_path',
    context: {
        scan_path: '',
        show_list: [],
        scraping: false,
        scrape_list: [],
    },
    states: {
        set_path: {
            invoke: {
                id: 'set-scan-path',
                src: invokeSetScanDirectory,
                onDone:  {
                    target: 'scan_directory',
                    actions: assign((context, event) => { 
                        console.log(event);
                        return {scan_path: event.data}
                    })
                },
                onError: {
                    target: 'display_msg'
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
                        console.log(event);
                        return {show_list: event.data, scraping: false}
                    })
                },
                onError: {
                    target: 'display_msg'
                }
            }
        },
        show_directory: {

        },
        has_scrape_task: {
            on: {
                '': [
                    {target: 'scrape', cond: (context, event) => context.scrape_list.length > 0},
                    {target: 'scan_directory'}
                ]
            }
        },
        scrape: {
            // based on incoming event jav_obj data, scrape accordingly
            invoke: {
                id: 'scrape-jav',
                src: (context, event) => invokeJavScrape(context.scrape_list[0]),
                onDone:  {
                    target: 'has_scrape_task',
                    actions: assign({scrape_list: (context, event) => context.scrape_list.slice(1)})
                },
                onError: {
                    target: 'display_msg'
                }
            }
        },
        search: {

        },
        display_msg: {

        }
    },
    on: {
        RESCAN: {target: '.set_path'},
        SCRAPE: {
            actions: assign({ scraping: true, scrape_list: (_, event) => event.value }),
            target: '.has_scrape_task'
        }
    }
});