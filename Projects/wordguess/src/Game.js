import React, { Component, Fragment } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import NumericInput from "react-numeric-input";
import Switch from "react-switch";
import {HintHandler} from './HintHandler.js';
// import * as _ from 'underscore';
import "./index.css";

const nbsp = String.fromCharCode(160);
const [EXACT, WRONG, NOTUSE] = [1,2,3];
const [EXACTBIT, WRONGBIT, NOTUSEBIT] = [2,4,8];


class Game extends Component {
    constructor() {
        super();
        this.settings = {
            wordlen: 5,
            guessMustBeWord : true,
            noMarkGuessChars : false,            
            hintUsePolicy : EXACTBIT,
        };
        this.state = {
            layoutName: "default",
            input: "",
            letterMap: {},
            guessList: [],
            useGamePage : true,
            settings: this.settings,
            message: null,
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
        if (this.focusRef && this.focusRef.current) {
            this.focusRef.focus();
        }
    }
    
    componentDidUpdate() {
        if (this.focusRef && this.focusRef.current) {
            console.log('did update', this.focusref);
            this.focusRef.focus();
        }
    }

    async startNewGame() {
        this.guessList = [];
        this.input = '';
        this.switchKey = 0;
        // this.notInPool = new Set();
        this.hintHandler = HintHandler.getHintHandler(this);
        await this.buildWordList(this.settings.wordlen);
        this.possibleList = Array.from(this.wordList);
        this.answer = this.wordList[Math.floor(Math.random() * this.wordList.length)].toUpperCase();
        // this.answer = 'FORDS';
        // this.answer = 'MOGUL';
        console.log('this.answer =', this.answer);
        this.setState({
            input: this.input,
            guessList: this.guessList,
            gameOver: false,
            message: null,
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
        let gchars = [...guess];
        let bchars = [...base];
        let posMap = new Array(this.settings.wordlen).fill(NOTUSE);
        // first do exact matches
        gchars.forEach( (gchar, index) => {
            if (gchar === bchars[index]) {
                bchars[index] = null;
                gchars[index] = null;
                posMap[index] = EXACT;
            }
        });
        // then do any more matches
        gchars.forEach( (gchar, index) => {
            if (gchar !== null) {
                const pos = bchars.indexOf(gchar);
                if (pos >= 0) {
                    bchars[pos] = null;
                    posMap[index] = WRONG;
                }
            }
        });
        return posMap;
    }

    mostRecentGuess() {
        return (this.guessList.length > 0 ? this.guessList.slice(-1)[0] : null);
    }
    
    
    async doInputSubmit() {
        let legalGuess = true;  // assume this
        if (this.input.length !== this.answer.length) return;
        // console.log('usedHintsObj', usedHintsObj);
        if (this.settings.guessMustBeWord && !this.wordList.includes(this.input)) {
            // await this.tempAlert('Guess must be a Legal Scrabble Word', 1500);
            this.setMessage('Guess must be a Legal Scrabble Word');
            legalGuess = false;
        }
        else if (this.settings.hintUsePolicy !== 0 && this.guessList.length > 0) {
            const messageJsx = this.hintHandler.checkUseAllHints(this.input);
            if (messageJsx) {
                console.log('messageJsx', messageJsx);
                this.setMessage(messageJsx, 'rgb(230,230,230)');
                legalGuess = false;
            }
        }
        if (legalGuess) {    
            // guess is legal, see how right it is
            const posMap = this.doCompare(this.input, this.answer);
            this.guessList.push({
                guess: this.input,
                index : this.guessList.length,
                posMap,
            });
            const basePosMap = posMap;
            this.possibleList = this.possibleList.filter(word => {
                const tstPosMap = this.doCompare(this.input, word);
                const ok = tstPosMap.every((val, index) => val === basePosMap[index]);
                // if (ok) console.log(word, tstPosMap, basePosMap);
                return ok;
            });
            // console.log(this.possibleList);
            
            if (posMap.every(val => val === EXACT)) {
                this.setState(
                    {gameOver:true,
                     message: this.buildGameOverMessage(),
                    });
            }
        }
        // clean up input for the next time thru
        if (legalGuess) {
            this.input = '';
            if (this.useVirtKeyboard) this.keyboard.clearInput();
        }
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
        if (this.state.gameOver) return;
        let key = event.nativeEvent.key;
        if (key === 'Backspace' && this.state.message != null) {
            this.setState({message: null});
        }
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
        for (let n=0; n < this.answer.length; n++) {
            const chval = (n < guess.length ? guess[n] : nbsp);
            // console.log('guessObj', guessObj);
            const bgcolor = this.hintHandler.computeGuessCharColor(guessObj, n, chval, submitted);
            guessLine.push(
                <div key={n} style={{
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
                }}>
                  {chval}
                </div>
            );
        };
        
        // conditionally  show total exact and wrongplace
        if (submitted) {
            this.hintHandler.formatGuessTotals(guessObj, guessLine);
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

    buildGameOverMessage() {
        const numGuesses = this.state.guessList.length;
        const html = `Match after ${numGuesses} ${numGuesses === 1 ? 'guess' : 'guesses'}!`;
        const againButton = (
              <button
                onClick = {this.startNewGame.bind(this)}
                style = {{
                    marginLeft: '5px',
                }}
              >
                Again
              </button>
        );

        return {html: html,
                bgcolor: 'white',
                msgButton: againButton,
               };
    }
    
    setMessage(html, bgcolor='pink', msgButton = null) {
        const msgObj = {html, bgcolor, msgButton};
        // console.log('setMessage', msgObj);
        this.setState({
            message: msgObj,
        });
    }
    
    genMessageLine() {
        // console.log('state.message', this.state.message);
        if (this.state.message === null) return (<Fragment></Fragment>);
        const buttonJsx = (this.state.message.msgButton === null ?
                           (<Fragment></Fragment>) :
                           this.state.message.msgButton);
        return(
            <div style={{backgroundColor : this.state.message.bgcolor}} >
               {<>{this.state.message.html}</>} 
              {buttonJsx}
            </div>
        );

                         
            
    }

    getPoolChars() {
        return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => !this.notInPool.has(c));
    }

    getSwitch(settingName) {
        if (true) return (
            <input
              type="checkbox"
              checked={this.state.settings[settingName]}
              onChange={() => {
                  this.settings[settingName] = !this.settings[settingName];
                  this.setState({settings: this.settings});
              }}
              id={settingName}
              height={15}
              width={30}
              style={{float: 'right'}}
            />
        )
        else return (
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
              style={{float: 'right'}}
            />
        );
    }
    
    // <div align='right' style={{display:'inline-block', textAlign:'right'}}>
    genSwitchSetting(settingName, labeltext) {
        return (
            <div key={this.switchKey++} style={{float: 'left', width:'300px'}}>
            <span style={{fontSize:'14px'}} >{`${labeltext}${nbsp}${nbsp}`} </span>
              <div style={{float: 'right'}} >
                {this.getSwitch(settingName)}
              </div>
              <br/>
            </div>
        );
    
    }

    genNumericInputSetting(settingName, labeltext) {
        return (
            <div style={{float: 'left', width:'320px'}}>
              <span style={{fontSize:'14px'}} >
                {labeltext}
              </span>
              <div style={{float:'right'}}>
                <NumericInput
                  id={settingName}
                  min={5}
                  max={8}
                  value={this.state.settings[settingName] || ""} 
                  onChange={(val) => {
                      this.settings[settingName] = val;
                      this.setState({settings: this.settings});
                  }}
                  style = {{
                      border: '1px solid black',
                      input: {
                          marginLeft: '5px',
                          height: '18px',
                          width: '40px',
                      },
                  }}
                >
                </NumericInput>
              </div>
            </div>
        );
    } 

    genRadioSetting(groupName, selectVal, text, index, isHorizontal) {
        // console.log('genRadioSetting', groupName, selectVal, text, isHorizontal);
        const lineBreak = (isHorizontal ? '' : <br/>);
        return (
            <Fragment>
              <input
                type="radio"
                value={parseInt(selectVal)}
                name={groupName}
                key={index}
                checked={this.settings[groupName] === parseInt(selectVal)}
                style = {{marginLeft: '15px'}}
                onChange={(event) => {
                    const name = event.target.name;
                    const val = parseInt(event.target.value);
                    this.settings[name] = val;
                    this.setState({settings: this.settings});
                    // console.log('onChange for Radio', name, val, this.settings, event);
                }}
              />
              {text}
              {lineBreak}
            </Fragment>
        );
    }

    genRadioGroupSetting(groupName, groupHeaderText, optsArray, isHorizontal=false) {
        // generate the radio options section
        // optsArray is a set of text, val pairs
        const optsJsxArray = optsArray.map((optset, index) => {
            const [text, val] = optset;
            return this.genRadioSetting(groupName, val, text, index, isHorizontal);
        });
        return (
            <Fragment>
              {groupHeaderText}
              <br/>
              <div
                value = {this.settings[groupName]}
              >
                {optsJsxArray}
              </div>
            </Fragment>
        );
    }

    
    render() {
        // console.log('render', this.state.message, this.focusRef);
        this.yellowString = ' ';
        this.greenString = ' ';
        this.greyString = ' ';
        this.notInPool = new Set();
        let guessLines = [];
        this.state.guessList.forEach( (guessObj) => {
            guessLines.push(this.formatGuess(guessObj, true));
            guessLines.push(<br/>);
        });
        // if game not over, push inputty line as well
        if (!this.state.gameOver) {
            const newObj = {
                guess: this.state.input,
                posMap: new Array(this.settings.wordlen).fill(NOTUSE),
            };
            guessLines.push(this.formatGuess(newObj, false));
        }
        const poolLine = (this.state.guessList.length === 0 ? ' ' :
                             `Pool: ${this.getPoolChars().join(' ')}`);

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
                  <div style={{width:'300px', display:'inline-block', fontSize:'14px'}}>
                    {this.genRadioGroupSetting('wordlen', 'Word Length (longer=harder)', [
                        ['5', 5], ['6', 6], ['7', 7], ['8', 8],
                    ], true)}
                    <br/>
                    {this.genSwitchSetting('guessMustBeWord', 'Guess must be word? (harder)') }
                    {this.genSwitchSetting('noMarkGuessChars', 'Not Mark Guess Chars? (much harder)') }
                    {this.genRadioGroupSetting('hintUsePolicy', 'Hint Reuse Requirements', [
                        ['None (most flexible)', 0],
                        ['Must Reuse Green (slightly harder)', EXACTBIT],
                        ['Must Reuse Green and Yellow (harder)', EXACTBIT+WRONGBIT],
                        ['Must Reuse All Hints (hardest and annoying)', EXACTBIT+WRONGBIT+NOTUSEBIT]
                    ])}
                  </div>
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
                    {`WordGuess Game,   ${this.possibleList ? this.possibleList.length : 0} Possible`}
                  </div>
                <div
                  onKeyDown = {this.onRealKeyDown.bind(this)}
                  tabIndex = {0}
                  ref = {div => this.focusRef = div}
                >
                  {guessLines}
                  {this.genMessageLine()}
                </div>
                {poolLine}
                {this.getVirtKeyboard()}
                </Fragment>
            );
        }

        return (
            this.state.useGamePage ? gamePage() : settingsPage()
        );
    }
}

export {Game, EXACT, WRONG, NOTUSE, EXACTBIT, WRONGBIT, NOTUSEBIT};
