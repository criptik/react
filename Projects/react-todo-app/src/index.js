import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
//component file
import TodoContainer from "./functionBased/components/TodoContainer";

//stylesheet
import "./functionBased/App.css"

const mainContainer =
    <React.StrictMode>
        <BrowserRouter>
            <TodoContainer />
        </BrowserRouter>
    </React.StrictMode>;

ReactDOM.render(mainContainer, document.getElementById("root"))

