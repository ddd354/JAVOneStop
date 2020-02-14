import React from "react";
import ReactDOM from "react-dom";

import i18n from './i18n.js'
import App from "./webHelper";

ReactDOM.render(<App t={i18n}/>, document.getElementById("content"));