import React, { Component, Fragment } from "react";
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
            guessList: [],
        };
        this.markGuessChars = true;
        this.useVirtKeyboard = false;
        this.guessMustBeWord = true;
        this.hintsMustBeUsed = true;
        this.answer = '';
    }

    tempAlert(msg,duration,bgcolor='red') {
        console.log(msg);
        var el = document.createElement("div");
        el.setAttribute("style", `position:absolute;\
                             top:0%; left:10%; \
                             background-color:${bgcolor}; \
                             border-color:black; \
                             border-width:1px; \
                             `);
        el.innerHTML = msg;
        setTimeout(function(){
            el.parentNode.removeChild(el);
        },duration);
        document.body.appendChild(el);
        return new Promise(resolve => setTimeout(resolve,duration));
    }
    
    async componentDidMount() {
        await this.buildWordList();
        this.startNewGame();
    }

    startNewGame() {
        this.gameOver = false;
        this.guessList = [];
        this.input = '';
        this.exactPos = new Set();
        this.yellowCharsMissing = {};
        this.answer = this.wordList[Math.floor(Math.random() * this.wordList.length)].toUpperCase();
        console.log('this.answer =', this.answer);
        this.setState({
            input: this.input,
            guessList: this.guessList,
        });
    }
    
    async buildWordList() {
        const URL = './sgb-words.txt';
        const data = await fetch(URL);
        console.log('fetch complete');
        const text = await data.text();
        console.log('data.text() complete');
        // console.log(text);
        this.wordList = await text.split('\n');
        this.wordList = await this.wordList.map(word => word.toUpperCase());
        console.log('wordlist built');
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
                bchars[pos] = null;
                wrongplace.push(n);
            }
        }
        return [exact, wrongplace];
    }

    usedAllHints(guess) {
        let retval = true;
        const guessAry = [...guess];
        // we will look in the previous input submission record (if any)
        if (this.guessList.length === 0) return true;
        const prevGuessObj = this.guessList.slice(-1)[0];
        this.greenCharsMissing = [];
        this.yellowCharsMissing = [];
        // first check previous exacts
        prevGuessObj.exact.forEach( pos => {
            const chr = prevGuessObj.guess[pos];
            if (guessAry[pos] === chr) {
                // clear so we don't reuse
                guessAry[pos] = null;
            }
            else {
                this.greenCharsMissing.push(chr);
                retval = false;
            }
        });
        // then check the wrongPlace chars exist somewhere
        prevGuessObj.wrongplace.forEach( pos => {
            const chr = prevGuessObj.guess[pos];
            const guessIdx = guessAry.indexOf(chr);
            if (guessIdx >= 0) {
                // clear so we don't reuse
                guessAry[guessIdx] = null;
            }
            else {
                this.yellowCharsMissing.push(chr);
                retval = false;
            }
        });
        return retval;
    }

    
    async doInputSubmit() {
        if (this.input.length !== this.answer.length) return;
        if (this.guessMustBeWord && !this.wordList.includes(this.input)) {
            await this.tempAlert('Guess must be a Word', 1500);
        }
        else if (this.hintsMustBeUsed && !this.usedAllHints(this.input)) {
            // build alert message
            const missingGreenHtml = `<span style="background-color:lightgreen;">${this.greenCharsMissing.join(',')}</span>`;
            const missingYellowHtml = `<span style="background-color:yellow;">${this.yellowCharsMissing.join(',')}</span>`;
            
            await this.tempAlert(`Guess must use Hints: <br/> ${missingGreenHtml} ${missingYellowHtml}`, 3000, 'rgb(230,230,230)');
        }
        else {
            // guess is legal, see how right it is
            const [exact, wrongplace] = this.doCompare(this.input, this.answer);
            // console.log('exact:', exact, ', wrongplace:', wrongplace);
            this.guessList.push({
                guess: this.input,
                exact,
                wrongplace,
            });
            if (exact.length === this.answer.length) this.gameOver = true;
        }
        this.input = '';
        if (this.useVirtKeyboard) this.keyboard.clearInput();
        this.setState({
            input: this.input,
            guessList: this.guessList,
        });
    }
    
    onVirtKeyPress(key) {
        console.log("Virt Key pressed", key);
        if (key === '{enter}') {
            this.doInputSubmit();
        }
    }

    onRealKeyDown(event) {
        if (this.gameOver) return;
        let key = event.nativeEvent.key;
        console.log("Real Key Down", key);
        if (key === 'Enter') {
            this.doInputSubmit();
        }
        else if (key === 'Backspace' && this.input.length > 0) {
            this.input = this.input.slice(0, -1);
            this.setState({ input: this.input });
        }
        else {
            key = key.toUpperCase();
            if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(key)) {
                this.input += key;
                if (this.input.length > this.answer.length) {
                    this.input = this.input.substring(0, this.answer.length);
                }
                this.setState({ input: this.input });
            }
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
        // console.log(`guessObj: (${guess})`, guessObj.exact, guessObj.wrongplace, 'this.answer', this.answer);
        for (let n=0; n < this.answer.length; n++) {
            const chval = (n < guess.length ? guess[n] : ' ');
            let bgcolor = 'white';
            if (this.markGuessChars) {
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
                    key: this.guessList.length,
                }}>
                  {chval}
                </div>
            );
        };
        // harder option to just show total exact and wrongplace
        if (!this.markGuessChars && submitted) {
            const exlen = guessObj.exact.length;
            const wplen = guessObj.wrongplace.length;
            for (let n=0; n<2; n++) {
                const chval = (n===0 ? exlen : wplen);
                guessLine.push(
                    <div style={{
                        borderRadius: '50%',
                        height: '20px',
                        width: '20px',
                        display: 'inline-block',
                        marginLeft: '10px',
                        marginBottom: '5px',
                        textAlign: 'center',
                        backgroundColor: (n ? 'yellow' : 'lightgreen'),
                    }}>
                      {chval}
                    </div>
                );
            }
        }
        return guessLine;
    }

    getVirtKeyboard() {
        if (!this.useVirtKeyboard) return <Fragment></Fragment>;
        return (
            <Keyboard
              keyboardRef={r => (this.keyboard = r)}
              onKeyPress = {this.onVirtKeyPress.bind(this)}
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
        );
    }

    getGameOverLine() { 
        if (!this.gameOver) return (<Fragment></Fragment>);
        const numGuesses = this.guessList.length;
        return (
            <div>
              {`Match after ${numGuesses} ${numGuesses === 1 ? 'guess' : 'guesses'}!`}
              <button
                onClick = {this.startNewGame.bind(this)}
                style = {{
                    marginLeft: '5px',
                }}
              >
                Again
              </button>
            </div>
        );
    }
    
    render() {
        console.log('render');
        this.yellowString = ' ';
        this.greenString = ' ';
        this.greyString = ' ';
        let guessLines = [];
        this.state.guessList.forEach( (guessObj) => {
            guessLines.push(this.formatGuess(guessObj, true));
            guessLines.push(<br/>);
        });
        // if game not over, push inputty line as well
        if (!this.gameOver) {
            const newObj = {
                guess: this.state.input,
                exact: [],
                wrongplace: [],
            };
            guessLines.push(this.formatGuess(newObj, false));
        }
        return (
            <Fragment>
            <div
              onKeyDown = {this.onRealKeyDown.bind(this)}
              tabIndex = '0'
            >
              {guessLines}
              {this.getGameOverLine()}
            </div>
              {this.getVirtKeyboard()}
            </Fragment>
        );
    }
}

export default Game;
