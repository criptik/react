import React, { Component } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./index.css";

class Game extends Component {
    constructor() {
        super();
        this.state = {
            layoutName: "default",
            input: "",
            letterMap: {},
        };
    }

    doCompare(guess, base) {
        let exact = [];
        let wrongplace = [];
        let gchars = [...guess];
        let bchars = [...base];
        // console.log(gchars, bchars);
        // first do exact matches
        for (let n=0; n<gchars.length; n++) {
            const gchar = gchars[n];
            if (gchar === bchars[n]) {
                bchars[n] = null;
                gchars[n] = null;
                exact.push(n);
            }
        }
        // then do any more matches
        for (let n=0; n<gchars.length; n++) {
            const gchar = gchars[n];
            if (gchar !== null && bchars.includes(gchar)) {
                let pos = bchars.indexOf(gchar);
                // console.log(`before, ${gchar}, ${bchars},  match at ${pos}`, wrongplace);
                bchars[pos] = null;
                wrongplace.push(n);
                // console.log(`after, ${gchar}, ${bchars},`, wrongplace);
            }
        }
        return [exact, wrongplace];
    }

    onKeyPress(letter) {
        const newMap = this.state.letterMap;
        const curval = newMap[letter];
        console.log("Letter pressed", letter, 'curval: ', curval);
        newMap[letter] = curval === undefined ? 1 : 2; 
        this.setState( {
            letterMap: newMap,
        });
    }

    onChange(input) {
        this.setState({ input });
        console.log("Input changed", input);
    }
    
    render() {
        console.log('render', this.state.letterMap);
        let redString = ' ';
        let greenString = ' '
        for (let letter in this.state.letterMap) {
            const val = this.state.letterMap[letter];
            if (val === 1) redString += ` ${letter}`;
            if (val === 2) greenString += ` ${letter}`;
        }
        let letterGuesses = [];
        const answer = 'HELLO';
        for (let n=0; n<answer.length; n++) {
            const chval = (n < this.state.input.length ? this.state.input[n] : ' ');
            letterGuesses.push(
                <div style={{
                    border: '1px solid black',
                    backgroundColor: 'white',
                    height: '20px',
                    width: '20px',
                    display: 'inline-block',
                    marginLeft: '5px',
                    textAlign: 'center',
                }}>
                  {chval}
                </div>
            );
        };
        return (
            <div>
              <div>
                {letterGuesses}
              </div>
              <Keyboard
                keyboardRef={r => (this.keyboard = r)}
                onKeyPress = {this.onKeyPress.bind(this)}
                onChange = {this.onChange.bind(this)}
                theme={"hg-theme-default hg-layout-default myTheme"}
              layoutName={this.state.layoutName}
                layout={{
                    default: [
                        "Q W E R T Y U I O P",
                        'A S D F G H J K L',
                        "Z X C V B N M {bksp} {enter}",
                    ]
                }}
                buttonTheme={[
                    {
                        class: "hg-red",
                        buttons: redString,
                    },
                    {
                        class: "hg-green",
                        buttons: greenString,
                    }
                ]}
                display={{
                    '{enter}' : 'submit',
                    '{bksp}' : '<<',
                }}
              />
            </div>
        );
    }
}

export default Game;
