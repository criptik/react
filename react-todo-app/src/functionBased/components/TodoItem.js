import React, {useState, useEffect} from "react";
import { FaTrash } from "react-icons/fa"
import PropTypes from "prop-types";


function TodoItem (props) {
    TodoItem.propTypes = { 
        todo : PropTypes.exact({
            id: PropTypes.number,
            title: PropTypes.string,
            completed: PropTypes.bool,
        }),
        completionToggleProps: PropTypes.func,
        deleteTodoProps: PropTypes.func,
        updateTitleProps: PropTypes.func,
    }; 

    const [curState, setNewState] = useState({
        editing : false,
        localTitle : '',
    });
    
    // returns a function that gets run on unmount
    useEffect(() => {
        return () => {
            console.log("Cleaning up...")
        }
    }, [])

    function handleEditing() {
        let todo = props.todo;
        console.log(`edit mode activated for id ${todo.id}`);
        setNewState({
            editing: true,
            localTitle : todo.title,
        });
        
    }
    
    let todo = props.todo;
    let myColor = (todo.completed) ? 'blue' : 'red';
    let myStyle = {
        color : myColor,
    };
    let viewMode = {};
    let editMode = {
        border: '1px solid black',
        display : 'block',
    };

    if (curState.editing) {
        viewMode.display = "none";
    } else {
        editMode.display = "none";
    }
    return (
        <li style={myStyle}>
            <div onDoubleClick={handleEditing} style={viewMode}>
                <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => props.completionToggleProps(todo.id)}
                />
                {todo.title}, id={todo.id}
                <button onClick={() => props.deleteTodoProps(todo.id)}>
                    <FaTrash
                        style={{ color: "orangered", fontSize: "16px" }}
                    />
                </button>
            </div>
            <input
                type="text"
                value={curState.localTitle}
                style={editMode}
                onChange={e => {
                    setNewState({...curState, localTitle : e.target.value});
                }}
                onKeyPress={e => {
                    if (e.key === 'Enter') {
                        props.updateTitleProps(e.target.value, todo.id);
                        setNewState({editing : false,  localTitle:''});
                    }
                }}
            />
        </li>
    );
}

export default TodoItem;

