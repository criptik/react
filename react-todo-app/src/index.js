import React from "react"
import ReactDOM from "react-dom"
//component file
import TodoContainer from "./components/TodoContainer"


const mainContainer =
    <React.StrictMode>
        <TodoContainer />
    </React.StrictMode>;

ReactDOM.render(mainContainer, document.getElementById("root"))

