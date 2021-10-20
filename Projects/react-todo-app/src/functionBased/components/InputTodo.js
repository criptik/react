import React, { useState } from "react";
import { FaPlusCircle } from "react-icons/fa";
import PropTypes from "prop-types";

function InputTodo(props)  {
    InputTodo.propTypes = {
        addTodoProp: PropTypes.func,
    };
    const [title, setTitle] = useState("");

    function onChange(e) {
        setTitle(e.target.value);
    }

    
    function handleSubmit(e) {
        e.preventDefault();
        if (title.trim()) {
            props.addTodoProp(title);
            setTitle("");
        }
        else {
            alert("Need Proper Title");
        }
    }
    
    return (
        <form onSubmit={handleSubmit} className="form-container">
            <input
                type="text"
                placeholder="Add todo..."
                value={title}
                name="title"
                onChange={onChange}
            />
            <button className="input-submit">
                <FaPlusCircle
                    style={{ color: "darkcyan", fontSize: "20px", marginTop: "2px" }}
                />
            </button>         
        </form>
    );
}


export default InputTodo
