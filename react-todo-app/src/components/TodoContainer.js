import React from "react";
import TodosList from "./TodosList";
import Header from "./Header";
import InputTodo from "./InputTodo";

class TodoContainer extends React.Component {
    state = {
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
    
    handleTodoChange(id) {
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

    testHandleTodoChange(id) {
        this.setState(prevState => {
            console.log(...prevState.todos);
            let newState = {todos: prevState.todos.map(todo => (todo.id === id) ? ({...todo, completed : !todo.completed}) : todo)};
            console.log(...newState.todos);
            return newState;
        });
    }

    origHandleTodoChange(id) {
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
                    containerChange={this.origHandleTodoChange.bind(this)}
                    deleteTodoProps={this.delTodo.bind(this)}
                />
            </React.Fragment>
        );
    }
}
export default TodoContainer
