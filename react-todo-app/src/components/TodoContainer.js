import React from "react"
import TodosList from "./TodosList";
import Header from "./Header";
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

    handleTodoChange(id) {
        this.setState(prevState => {
            todos: prevState.todos.map(todo => (todo.id === id) ? {...todo, completed : !todo.completed} : todo)
        })
    }
        
    render() {
        const redStyle = {
            color : 'red',
        }

        return (
            <React.Fragment>
            <h1>Hello from Create React App</h1>
            <p style={redStyle}>I am really really in a React Component!</p>
            <Header />
            <TodosList todos={this.state.todos}  containerChange={this.handleTodoChange.bind(this)} />
            </React.Fragment>
        );
    }
}
export default TodoContainer
