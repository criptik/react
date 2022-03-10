import React, { Component, Fragment } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import {HintHandler} from './HintHandler.js';
import {SettingsPage} from './SettingsPage.js';

// import * as _ from 'underscore';
import "./index.css";

const nbsp = String.fromCharCode(160);
const [EXACT, WRONG, NOTUSE] = [1,2,3];
const [EXACTBIT, WRONGBIT, NOTUSEBIT] = [2,4,8];
const savedGameStorageName = 'wordguessSavedGame';
// list of fields from the this that we will save
const savedGameFields = [
    'settings',
    'answer',
    'guessList',
    'gameOver',
    'message',
    'illegalGuessCount',
];


class Game extends Component {
    constructor() {
        super();
        // uncomment to get rid of old storage item (eg, if new format needed)
        // window.localStorage.removeItem(savedGameStorageName);
        const savedGameJSON = window.localStorage.getItem(savedGameStorageName);
        // console.log('savedGameJSON:', savedGameJSON);
        if (savedGameJSON) {
            this.restoreSavedState(savedGameJSON);
        } else {
            this.setDefaultGameState();
        }
        // can setup state directly here since in constructor
        this.state = this.initReactState;
    }

    setDefaultGameState() {
        console.log('setting default game state');
        // default settings
        this.settings = {
            wordlen: 5,
            guessMustBeWord : true,
            noMarkGuessChars : false,            
            hintUsePolicy : EXACTBIT,
            useVirtKeyboard: false,
            allowPlurals: false,
        };
        this.answer = '';
        this.focusRef = React.createRef();
        this.usedDefaultGameState = true;
        this.illegalGuessCount = 0;
        this.message = '';
        // return the state that the constructor will put in this.state directly
        this.initReactState = {
            layoutName: "default",
            input: "",
            letterMap: {},
            guessList: [],
            useGamePage : false,   // enforce settings for very first time thru
            settings: this.settings,
            message: this.message,
            illegalGuessCount: this.illegalGuessCount,
        };
    }

    async restoreSavedState(savedGameJSON) {
        const savedGame = JSON.parse(savedGameJSON);
        savedGameFields.forEach( (field) => this[field] = savedGame[field]);
        this.focusRef = React.createRef();
        this.hintHandler = HintHandler.getHintHandler(this);
        this.usedDefaultGameState = false;
        this.input = '';
        // notInPool will be rebuilt on each render so no need to restore here
        this.tempAlert('Restored Saved Game State', 1500);
        // return the state that the constructor will put in this.state directly
        this.initReactState = {
            layoutName: "default",
            letterMap: {},
            useGamePage : true,   // since we saved things while in gamepage
            settings: this.settings,
            input: this.input,
            gameOver: this.gameOver,
            illegalGuessCount: this.illegalGuessCount,
            guessList: this.guessList,
            message: (this.gameOver ? this.buildGameOverMessage() : this.message),                       
        };

        // reconstruct the longer wordList and possibleList
        await this.buildWordList(this.settings.wordlen);
        // reconstruct possibleList from guessList (so we didn't have to save the whole possibleList)
        this.possibleList = Array.from(this.wordList);
        this.guessList.forEach((guessObj) => {
            this.possibleList = this.getNewPossibleList(guessObj.guess, guessObj.posMap);
        });
        this.setState({possibleListLen: this.possibleList.length});
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
        if (this.usedDefaultGameState) this.startNewGame();
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
        this.hintHandler = HintHandler.getHintHandler(this);
        await this.buildWordList(this.settings.wordlen);
        this.possibleList = Array.from(this.wordList);
        this.answer = this.wordList[Math.floor(Math.random() * this.wordList.length)].toUpperCase();
        // this.answer = 'TEMPS';
        // console.log('this.answer =', this.answer);
        this.gameOver = false;
        this.illegalGuessCount = 0;
        this.setState({
            input: this.input,
            guessList: this.guessList,
            gameOver: false,
            illegalGuessCount: this.illegalGuessCount,
            message: null,
        });
        if (this.focusRef.current) {
            this.focusRef.focus();
        }
    }
    
    async buildWordList(wordlen, allowPlurals=this.settings.allowPlurals) {
        if (wordlen === this.curAnswerLen) return;
        this.curAnswerLen = wordlen;
        const URL = `/wordguess/ospd${allowPlurals ? '' : 'np'}${wordlen}.txt`;
        // console.log('URL', URL);
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
    

    getNewPossibleList(baseInput, basePosMap) {
        return this.possibleList.filter(word => {
            const tstPosMap = this.doCompare(baseInput, word);
            const ok = this.hintHandler.possibleListFilter(tstPosMap, basePosMap);
            // if (ok) console.log(word, tstPosMap, basePosMap);
            return ok;
        });
    }
    
    async doInputSubmit() {
        let legalGuess = true;  // assume this
        if (this.input.length !== this.answer.length) return;
        // console.log('usedHintsObj', usedHintsObj);
        if (this.settings.guessMustBeWord && !this.wordList.includes(this.input)) {
            // await this.tempAlert('Guess must be a Legal Scrabble Word', 1500);
            this.setMessage(`Guess must be in wordlist ${this.settings.allowPlurals ? '' : ', plurals are disabled'}`);
            legalGuess = false;
        }
        else if (this.settings.hintUsePolicy !== 0 && this.guessList.length > 0) {
            const messageJsx = this.hintHandler.checkUseAllHints(this.input);
            if (messageJsx) {
                // console.log('messageJsx', messageJsx);
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
            this.possibleList = this.getNewPossibleList(this.input, posMap);
            // console.log(this.possibleList);
            
            if (posMap.every(val => val === EXACT)) {
                this.gameOver = true;
                this.setState(
                    {gameOver:true,
                     message: this.buildGameOverMessage(),
                    });
            }
        }
        // clean up input for the next time thru
        if (legalGuess) {
            this.input = '';
            if (this.settings.useVirtKeyboard) this.keyboard.clearInput();
        }
        else {
            this.illegalGuessCount++;
            this.setState({
                illegalGuessCount: this.illegalGuessCount,
            });
        }
        this.setState({
            input: this.input,
            guessList: this.guessList,
        });

        // handle the fact that embedded objects need their fields in the list
        // the last fields are from guessList objects (shown explicitly in case the list is empty)
        const filteredFieldNames =  [...savedGameFields, ...Object.keys(this.settings), 'guess', 'index', 'posMap'];
        const JSONstring = JSON.stringify(this, filteredFieldNames);
        window.localStorage[savedGameStorageName] = JSONstring;
        // console.log('JSONstring:', JSON.stringify(this, filteredFieldNames, 2));
        
    }

    commonKeyHandler(key) {
        if (this.state.gameOver) return;
        if (key === '?') console.log('this.answer =', this.answer);
        if (key === 'Backspace' && this.state.message != null) {
            this.setState({message: null});
        }
        if (['Enter', '{enter}'].includes(key)) {
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
    
    onVirtKeyPress(key) {
        // console.log("Virt Key pressed", key);
        this.commonKeyHandler(key);
    }

    onRealKeyDown(event) {
        let key = event.nativeEvent.key;
        // console.log("Real Key Down", key);
        this.commonKeyHandler(key);
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
        if (!this.settings.useVirtKeyboard) return <Fragment></Fragment>;
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
        const numGuesses = this.guessList.length;
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
        return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => this.notInPool[c] !== 1);
    }
    
    render() {
        // console.log('render', this.state);
        if (!this.state || Object.keys(this.state).length === 0) return null;
        this.yellowString = ' ';
        this.greenString = ' ';
        this.greyString = ' ';
        this.notInPool = {};
        let guessLines = [];
        this.guessJsxIndex = 0;
        this.state.guessList.forEach( (guessObj) => {
            guessLines.push(<Fragment key={this.guessJsxIndex++}>{this.formatGuess(guessObj, true)}</Fragment>);
            guessLines.push(<br key={this.guessJsxIndex++}/>);
        });
        // if game not over, push inputty line as well
        if (!this.state.gameOver && this.state.input !== undefined) {
            const newObj = {
                guess: this.state.input,
                posMap: new Array(this.settings.wordlen).fill(NOTUSE),
            };
            guessLines.push(this.formatGuess(newObj, false));
        }
        const poolLine = (this.state.guessList.length === 0 ? ' ' :
                             `Pool: ${this.getPoolChars().join(' ')}`);

        const legalGuessCount = this.state.guessList.length;
        const illegalGuessCount = this.state.illegalGuessCount;
        let guessCountLine = `Guesses Legal: ${legalGuessCount}`;
        if (this.settings.countIllegalGuesses) guessCountLine = `${guessCountLine}, Illegal: ${illegalGuessCount}`;
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
                  <br/> 
                  {guessCountLine}
                  <br/> 
                  {this.getVirtKeyboard()}
                </Fragment>
            );
        }

        return (
            this.state.useGamePage ? gamePage() : <SettingsPage  gameObj={this}/>
        );
    }
}

export {Game, EXACT, WRONG, NOTUSE, EXACTBIT, WRONGBIT, NOTUSEBIT};
