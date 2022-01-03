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
        this.guessList = [];
        const URL = './sgb-words.txt';
        let answerArray = [];
        this.answer = ' ';
        fetch(URL)
            .then(data => data.text())
            .then(text => {
                // console.log('text is ', text);
                answerArray = text.split('\n'); 
                // console.log('answerArray', answerArray);
                this.answer = answerArray[Math.floor(Math.random() * answerArray.length)].toUpperCase();
                console.log('this.answer =', this.answer);
                this.setState({answer: this.answer });
            });
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

    onKeyPress(key) {
        console.log("Letter pressed", key);
        if (key === '{enter}') {
            const [exact, wrongplace] = this.doCompare(this.input, this.answer);
            console.log('exact:', exact, ', wrongplace:', wrongplace);
            this.guessList.push({
                guess: this.input,
                exact,
                wrongplace,
            });
            this.input = '';
            this.keyboard.clearInput();
        }
    }

    onChange(input) {
        if (input.length > this.answer.length) {
            input = input.substring(0, this.answer.length);
            this.keyboard.setInput(input);        }
        this.input = input;
        this.setState({ input });
        console.log("Input changed", input);
    }

    formatGuess(guessObj, submitted=false) {
        let guessLine = [];
        const guess = guessObj.guess;
        console.log(`guessObj: (${guess})`, guessObj.exact, guessObj.wrongplace, 'this.answer', this.answer);
        for (let n=0; n < this.answer.length; n++) {
            const chval = (n < guess.length ? guess[n] : ' ');
            let bgcolor = 'white';
            if (guessObj.exact.includes(n)) {
                bgcolor = 'lightgreen';
                this.greenString += ` ${chval}`;
            }
            else if (guessObj.wrongplace.includes(n)) {
                bgcolor = 'yellow';
                this.yellowString += ` ${chval}`;
            }
            else if (submitted) {
                this.greyString += ` ${chval}`;
            }
            guessLine.push(
                <div style={{
                    border: '1px solid black',
                    backgroundColor: bgcolor,
                    height: '20px',
                    width: '20px',
                    display: 'inline-block',
                    marginLeft: '5px',
                    marginBottom: '5px',
                    textAlign: 'center',
                }}>
                  {chval}
                </div>
            );
        };
        return guessLine;
    }
    
    render() {
        console.log('render');
        this.yellowString = ' ';
        this.greenString = ' ';
        this.greyString = ' ';
        let guessLines = [];
        this.guessList.forEach( (guessObj) => {
            guessLines.push(this.formatGuess(guessObj, true));
            guessLines.push(<br/>);
        });
        const newObj = {
            guess: this.state.input,
            exact: [],
            wrongplace: [],
        };
        guessLines.push(this.formatGuess(newObj, false));
        return (
            <div>
              <div>
                {guessLines}
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
                        class: "hg-yellow",
                        buttons: this.yellowString,
                    },
                    {
                        class: "hg-green",
                        buttons: this.greenString,
                    },
                    {
                        class: "hg-grey",
                        buttons: this.greyString,
                    }
                    
                ]}
                display={{
                    '{enter}' : 'enter',
                    '{bksp}' : '<<',
                }}
              />
            </div>
        );
    }
}

export default Game;
