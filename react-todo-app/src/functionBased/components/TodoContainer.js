import React from "react";
import TodosList from "./TodosList";
import Header from "./Header";
import InputTodo from "./InputTodo";

class TodoContainer extends React.Component {
    state = {
        todos: [],
        nextid: 1,
    };
    
    dummyState = {
        todos: [
            {
                id: 1,
                title: "Setup development environment",
                completed: true
            },
            {
                id: 2,
                title: "Develop website and add content",
                completed: false
            },
            {
                id: 3,
                title: "Deploy to live server",
                completed: false
            }
        ]
    };        

    componentDidMount() {
        const temp = localStorage.getItem("todosState")
        const loadedTodosState = JSON.parse(temp)
        if (loadedTodosState) {
            this.setState(loadedTodosState);
        }
    }

    dummyComponentDidMount() {
        fetch("https://jsonplaceholder.typicode.com/todos")
            .then(response => response.json())
            .then(data => console.log(data));
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState !== this.state) {
            const temp = JSON.stringify(this.state)
            localStorage.setItem("todosState", temp)
        }
    }

    setUpdateTitle(updatedTitle, id) {
        console.log(updatedTitle, id);
        this.setState(prevState => ({
            todos: prevState.todos.map(todo => (todo.id === id) ? {...todo, title : updatedTitle} : todo)
        }));
    }
    
    debugHandleTodoChange(id) {
        function completedUpdater(prevState) {
            console.group('completedUpdated');
            console.log(...prevState.todos);
            let newState = {
                todos: prevState.todos.map(todo => (todo.id === id) ? {...todo, completed : !todo.completed} : todo)
            };
            console.log(...newState.todos);
            console.groupEnd();
            return newState;
        }

        this.setState(prevState => completedUpdater(prevState));
    }

    handleTodoChange(id) {
        this.setState(prevState => ({
            todos: prevState.todos.map(todo => (todo.id === id) ? {...todo, completed : !todo.completed} : todo)
        }));
    }

    delTodo(id) {
        this.setState(prevState => ({
            todos: prevState.todos.filter(todo => (todo.id !== id))
        }));
    }

    addTodoItem(title) {
        let newid = this.state.nextid;
            const newTodo = {
                id: newid,
                title: title,
                completed: false
            };
        
        this.setState({
            todos: [...this.state.todos, newTodo],
            nextid: newid+1,
        });
    }
    
    render() {
        const redStyle = {
            color : 'red',
        };

        return (
            <React.Fragment>
                <h1>Hello from the React Todo App</h1>
                <h3 style={redStyle}>This is the function-based Implementation.</h3>
                <Header />
                <InputTodo
                    addTodoProp={this.addTodoItem.bind(this)}
                />
                <TodosList
                    todos={this.state.todos}
                    containerChange={this.handleTodoChange.bind(this)}
                    deleteTodoProps={this.delTodo.bind(this)}
                    updateTitleProps={this.setUpdateTitle.bind(this)}
                />
            </React.Fragment>
        );
    }
}
export default TodoContainer
