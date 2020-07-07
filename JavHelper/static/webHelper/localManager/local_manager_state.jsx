import { Machine, assign } from 'xstate';

const invokeScanDirectory = () => {
    return fetch('/directory_scan/pre_scan_files')
        .then(response => response.json())
        .then(jsonData => jsonData.response)
}

export const localManagerState = Machine({
    id: 'topLocalManager',
    initial: 'scan_directory',
    context: {
        show_list: []
    },
    states: {
        scan_directory: {
            // when enter, scan directory and render
            invoke: {
                id: 'scan-directory',
                src: invokeScanDirectory,
                onDone:  {
                    target: 'show_directory',
                    actions: assign((context, event) => { 
                        console.log(event);
                        return {show_list: event.data}
                    })
                },
                onError: {
                    target: 'display_msg'
                }
            }
        },
        show_directory: {

        },
        search: {

        },
        display_msg: {

        }
    }
});