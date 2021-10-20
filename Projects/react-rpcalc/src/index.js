import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
//component file
import RpcalcContainer from "./classBased/components/RpcalcContainer";

//stylesheet
import "./classBased/App.css"

const mainContainer =
    <React.StrictMode>
        <BrowserRouter>
            <RpcalcContainer />
        </BrowserRouter>
    </React.StrictMode>;

ReactDOM.render(mainContainer, document.getElementById("root"))

