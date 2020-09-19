import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import i18n from './i18n.js'
import App from "./webHelper";

ReactDOM.render(
    <BrowserRouter>
        <App t={i18n}/>
    </BrowserRouter>, 
    document.getElementById("content")
);