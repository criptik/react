import React from 'react';

class ElapsedTime extends React.Component {
    static formatSeconds(totalSecs) {
        const elapsedMins = Math.trunc(totalSecs / 60);
        const elapsedSecs = Math.trunc(totalSecs) % 60;
        return `${Number(elapsedMins).toString().padStart(2, ' ')}:${Number(elapsedSecs).toString().padStart(2, 0)}`;
    }
    
    render() {
        // console.log(this.state.elapsed, this.props.paused);
        let elapsedStr = ElapsedTime.formatSeconds(this.props.elapsedSecs);
        if (this.props.useDelta) {
            elapsedStr = `${String.fromCharCode(916)} ${elapsedStr}`;
        }
        return (
            <span style={{fontSize: "20px"}}
              className="elapsedcomp">
              {elapsedStr}
            </span>
        );
    }
}

export default ElapsedTime;
