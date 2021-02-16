import React, { useState } from "react";
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
            <button>Submit</button>
        </form>
    );
}


export default InputTodo
