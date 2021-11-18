import React from 'react';

class ElapsedTime extends React.Component {
    render() {
        // console.log(this.state.elapsed, this.props.paused);
        let elapsedSecs = Math.trunc(this.props.elapsedSecs);
        let elapsedMins = Math.trunc(elapsedSecs / 60);
        elapsedSecs = elapsedSecs % 60;
        let elapsedStr = `${Number(elapsedMins).toString().padStart(2, ' ')}:${Number(elapsedSecs).toString().padStart(2, 0)}`;
        return (
            <span style={{fontSize: "20px"}}
              className="elapsedcomp">
              {elapsedStr}
            </span>
        );
    }
}

export default ElapsedTime;
