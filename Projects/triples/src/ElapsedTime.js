import React from 'react';

class ElapsedTime extends React.Component {
    constructor() {
        super();
        this.isPaused = false;
        this.state = {
            elapsed: 0,
        }
    }
    
    componentDidMount() {
        this.setNewTimer();
    }

    setNewTimer() {
        this.timer = setInterval(() => this.updateElapsed.bind(this)(), 1000);
    }
    
    updateElapsed() {
        if (!this.props.paused) {
            this.setState({
                elapsed: this.state.elapsed + 1,
            });
        }
    }

    getDerivedStateFromProps() {
    }
    
    render() {
        if (this.props.clearElapsed && this.state.elapsed !== 0) {
            this.setState({
                elapsed: 0,
            });
        }
        if (this.props.paused !==  this.isPaused) {
            this.isPaused = this.props.paused;
            if (this.props.paused) {
                clearInterval(this.timer);
            } else {
                this.setNewTimer();
            }
        }
        // console.log(this.state.elapsed, this.props.paused);
        let elapsedSecs = Math.trunc(this.state.elapsed);
        let elapsedMins = Math.trunc(elapsedSecs / 60);
        elapsedSecs = elapsedSecs % 60;
        let elapsedStr = `${elapsedMins}:${Number(elapsedSecs).toString().padStart(2, 0)}`;
        return (
            <span style={{fontSize: "20px"}}
              className="elapsedcomp">
              {elapsedStr}
            </span>
        );
    }
}

export default ElapsedTime;
