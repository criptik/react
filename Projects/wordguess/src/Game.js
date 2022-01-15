import React, { Component, Fragment } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import NumericInput from "react-numeric-input";
import Switch from "react-switch";
import "./index.css";

const nbsp = String.fromCharCode(160);
class Game extends Component {
    constructor() {
        super();
        this.settings = {
            wordlen: 5,
            guessMustBeWord : true,
            markGuessChars : true,            
            hintsMustBeUsed : true,
        };
        this.state = {
            layoutName: "default",
            input: "",
            letterMap: {},
            guessList: [],
            useGamePage : false,
            settings: this.settings,
        };
        this.useVirtKeyboard = false;
        this.answer = '';
        this.focusRef = React.createRef();
    }

    tempAlert(msg,duration,bgcolor='red') {
        // console.log(msg);
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
        this.startNewGame();
        if (this.focusRef.current) {
            this.focusRef.focus();
        }
    }
    
    componentDidUpdate() {
        if (this.focusRef.current) {
            this.focusRef.focus();
        }
    }

    async startNewGame() {
        this.gameOver = false;
        this.guessList = [];
        this.input = '';
        await this.buildWordList(this.settings.wordlen);
        this.answer = this.wordList[Math.floor(Math.random() * this.wordList.length)].toUpperCase();
        console.log('this.answer =', this.answer);
        this.setState({
            input: this.input,
            guessList: this.guessList,
        });
        if (this.focusRef.current) {
            this.focusRef.focus();
        }
    }
    
    async buildWordList(wordlen) {
        if (wordlen === this.curAnswerLen) return;
        this.curAnswerLen = wordlen;
        const URL = `./ospd${wordlen}.txt`;
        const data = await fetch(URL);
        console.log('fetch complete');
        const text = await data.text();
        // console.log('data.text() complete');
        // console.log(text);
        this.wordList = await text.split('\n');
        this.wordList = await this.wordList.map(word => word.toUpperCase());
        console.log(`wordlist for len ${wordlen} built`);
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

    mostRecentGuess() {
        return (this.guessList.length > 0 ? this.guessList.slice(-1)[0] : null);
    }
    
    // returns two arrays of green missing and yellow missing if any
    usedAllHints(guess) {
        // short circuit in certain situations
        let greenCharsMissing = [];
        let yellowCharsMissing = [];
        if (this.settings.hintsMustBeUsed && this.guessList.length > 0) {
            const guessAry = [...guess];
            // we will look in the previous input submission record (if any)
            const prevGuessObj = this.mostRecentGuess();
            // console.log('prevGuess', prevGuessObj);
            // first check previous exacts
            prevGuessObj.exact.forEach( pos => {
                const chr = prevGuessObj.guess[pos];
                if (guessAry[pos] === chr) {
                    // clear so we don't reuse
                    guessAry[pos] = null;
                }
                else {
                    greenCharsMissing.push(chr);
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
                    yellowCharsMissing.push(chr);
                }
            });
        }
        return [greenCharsMissing, yellowCharsMissing];
    }

    
    async doInputSubmit() {
        let legalGuess = true;  // assume this
        if (this.input.length !== this.answer.length) return;
        // console.log('usedHintsObj', usedHintsObj);
        if (this.settings.guessMustBeWord && !this.wordList.includes(this.input)) {
            await this.tempAlert('Guess must be a Legal Scrabble Word', 1500);
            legalGuess = false;
        }
        else if (this.settings.hintsMustBeUsed) {
            const [greenMissing, yellowMissing] = this.usedAllHints(this.input);
            if (greenMissing.length > 0 || yellowMissing.length > 0) {
                // build alert message
                const missingGreenHtml = `<span style="background-color:lightgreen;">${greenMissing.join(',')}</span>`;
                const missingYellowHtml = `<span style="background-color:yellow;">${yellowMissing.join(',')}</span>`;
                await this.tempAlert(`Guess must use Hints: <br/> ${missingGreenHtml} ${missingYellowHtml}`,
                                     3000, 'rgb(230,230,230)');
                legalGuess = false;
            }
        }
        if (legalGuess) {    
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
        // clean up input for the next time thru
        this.input = '';
        if (this.useVirtKeyboard) this.keyboard.clearInput();
        this.setState({
            input: this.input,
            guessList: this.guessList,
        });
    }
    
    onVirtKeyPress(key) {
        // console.log("Virt Key pressed", key);
        if (key === '{enter}') {
            this.doInputSubmit();
        }
    }

    onRealKeyDown(event) {
        if (this.gameOver) return;
        let key = event.nativeEvent.key;
        // console.log("Real Key Down", key);
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
        // console.log("Input changed", input);
    }

    formatGuess(guessObj, submitted=false) {
        let guessLine = [];
        const guess = guessObj.guess;
        // console.log(`guessObj: (${guess})`, guessObj.exact, guessObj.wrongplace, 'this.answer', this.answer);
        for (let n=0; n < this.answer.length; n++) {
            const chval = (n < guess.length ? guess[n] : nbsp);
            let bgcolor = 'white';
            if (this.settings.markGuessChars) {
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
                    marginTop: '5px',
                    textAlign: 'center',
                    // fontSize: '16px',
                    key: this.guessList.length,
                }}>
                  {chval}
                </div>
            );
        };
        // harder option to just show total exact and wrongplace
        if (!this.state.settings.markGuessChars && submitted) {
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
        const numGuesses = this.state.guessList.length;
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

    getUntriedChars() {
        return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => !this.yellowString.includes(c) &&
                                                        !this.greenString.includes(c) &&
                                                        !this.greyString.includes(c));
    }

    genSwitchSetting(settingName, labeltext) {
        return (
            <Fragment>
              <label>
                {`${labeltext}${nbsp}${nbsp}`} 
                <Switch
                  className="react-switch"
                  onChange={(checked) => {
                      this.settings[settingName] = checked;
                      this.setState({settings: this.settings});
                  }}
                  id={settingName}
                  checked={this.state.settings[settingName]}
                  height={15}
                  width={30}
                />
              </label>
              <br/>
            </Fragment>
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
        const untriedLine = (this.state.guessList.length === 0 ? ' ' :
                             `Untried: ${this.getUntriedChars().join(' ')}`);

        const settingsPage= () => {
            return (
                // first is button to return to game
                <div>
                  <button
                    style = {{
                        marginRight: '10px',
                        marginBottom: '5px',
                    }}
                    onClick = {() => {
                        this.setState({useGamePage:true});
                        this.startNewGame();
                    }}

                  >
                    {String.fromCharCode(0x2b05)}
                  </button>
                  Settings
                  <br/>
                  <label>Word Length (longer=harder)
                      <NumericInput
                        id="wordlen"
                        min={5}
                        max={8}
                        value={this.state.settings.wordlen || ""} 
                        onChange={(val) => {
                            this.settings.wordlen = val;
                            this.setState({settings: this.settings});
                        }}
                        style = {{
                            border: '1px solid black',
                            input: {
                                marginLeft: '5px',
                                height: '20px',
                                width: '50px',
                            }
                        }}
                      >
                      </NumericInput>
                    </label>
                    <br/>
                  {this.genSwitchSetting('guessMustBeWord', 'Guess must be in wordlist? (true=harder)') }
                  {this.genSwitchSetting('markGuessChars', 'Mark Guess Chars? (true=easier)') }
                  {this.genSwitchSetting('hintsMustBeUsed', 'Hints Must Be Used in Later Bids? (true=harder)') }
                </div>
            );
        }

        const gamePage = () => {
            return (
                <Fragment>
                  <div>
                    <button
                      style = {{
                          marginRight: '10px',
                      }}
                      onClick = {() => this.setState({useGamePage:false})}
                    >
                      {String.fromCharCode(0x2699)}
                    </button>
                    WordGuess Game
                  </div>
                <div
                  onKeyDown = {this.onRealKeyDown.bind(this)}
                  tabIndex = {-1}
                  ref = {div => this.focusRef = div}
                >
                  {guessLines}
                  {this.getGameOverLine()}
                </div>
                {untriedLine}
                {this.getVirtKeyboard()}
                </Fragment>
            );
        }

        return (
            this.state.useGamePage ? gamePage() : settingsPage()
        );
    }
}

export default Game;
