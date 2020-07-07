import React from 'react';
import { useMachine } from '@xstate/react';

import { localManagerState } from './local_manager_state'


const LocalManager = () => {
    const [currentState, setCurrentState] = useMachine(localManagerState)
    const {show_list} = currentState.context

    return (
        <div>
            {show_list.map(ind_file => {
                return <p key={ind_file.file_name}>{ind_file.file_name}</p>
            })}
        </div>
    )
}

export default LocalManager