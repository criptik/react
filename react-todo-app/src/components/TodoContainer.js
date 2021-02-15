import React from "react";
import TodosList from "./TodosList";
import Header from "./Header";
import InputTodo from "./InputTodo";

class TodoContainer extends React.Component {
    state = {
        todos: [],
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

    nextid=4;

    componentDidMount() {
        const temp = localStorage.getItem("todos")
        const loadedTodos = JSON.parse(temp)
        if (loadedTodos) {
            this.setState({
                todos: loadedTodos
            })
        }
    }

    dummyComponentDidMount() {
        fetch("https://jsonplaceholder.typicode.com/todos")
            .then(response => response.json())
            .then(data => console.log(data));
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.todos !== this.state.todos) {
            const temp = JSON.stringify(this.state.todos)
            localStorage.setItem("todos", temp)
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
        const newTodo = {
            id: this.nextid++,
            title: title,
            completed: false
        };
        
        this.setState({
            todos: [...this.state.todos, newTodo]
        });
    }
    
    render() {
        const redStyle = {
            color : 'red',
        };

        return (
            <React.Fragment>
                <h1>Hello from Create React App</h1>
                <p style={redStyle}>I am really really in a React Component!</p>
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
