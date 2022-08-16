import React, { Component, Fragment } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import {HintHandler} from './HintHandler.js';
import {SettingsPage} from './SettingsPage.js';

// import * as _ from 'underscore';
import "./index.css";

const nbsp = String.fromCharCode(160);
const [EXACT, WRONG, NOTUSE, UNKNOWN] = [1,2,3,4];
const [EXACTBIT, WRONGBIT, NOTUSEBIT] = [2,4,8];
const WILDCHAR = '?';
const savedGameStorageName = 'wordguessSavedGame';
// list of fields from the this that we will save
const savedGameFields = [
    'settings',
    'answer',
    'guessList',
    'gameOver',
    'message',
    'totalGuesses',
    'input',
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
        this.isMobile = ('ontouchstart' in document.documentElement);
        // console.log('constructor state set complete');
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
            startWithReveal: false,
        };
        this.answer = '';
        this.inputElem = React.createRef();
        this.usedDefaultGameState = true;
        this.totalGuesses = 0;
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
            totalGuesses: this.totalGuesses,
        };
    }

    restoreSavedState(savedGameJSON) {
        const savedGame = JSON.parse(savedGameJSON);
        console.log('restore', savedGame);
        savedGameFields.forEach( (field) => this[field] = savedGame[field]);
        this.inputElem = React.createRef();
        this.setInputs(this.input);
        this.hintHandler = HintHandler.getHintHandler(this);
        this.usedDefaultGameState = false;
        // notInPool will be rebuilt on each render so no need to restore here
        this.tempAlert('Restored Saved Game State', 1500);
        this.prevDataLength = 0;
        // return the state that the constructor will put in this.state directly
        this.initReactState = {
            layoutName: "default",
            letterMap: {},
            useGamePage : true,   // since we saved things while in gamepage
            settings: this.settings,
            input: this.input,
            gameOver: this.gameOver,
            totalGuesses: this.totalGuesses,
            guessList: this.guessList,
            message: this.message,                       
        };

        // console.log(`restoreSavedState this.guessList=${this.guessList}`);
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
        // console.log('didMount', this.inputElem);
        if (this.usedDefaultGameState) {
            this.startNewGame();
        }
        else {
            // we are using a restored state,
            // reconstruct the longer wordList and possibleList
            // we do this here because constructor cannot be async
            await this.buildWordList(this.settings.wordlen);
            // reconstruct possibleList from guessList (so we didn't have to save the whole possibleList)
            this.possibleList = Array.from(this.wordList);
            this.guessList.forEach((guessObj) => {
                this.possibleList = this.getNewPossibleList(guessObj.guess, guessObj.posMap);
            });
            this.setState({possibleListLen: this.possibleList.length});
            // console.log(`componentDidMount possibleListLen=${this.possibleList.length}, gameOver=${this.gameOver}`);
            // also gameOverMessage if needed
            if (false && this.gameOver) {
                this.input = this.answer;
                this.message = await this.buildGameOverMessage();
                this.setState(
                    {gameOver:true,
                     message: this.message,
                    });
            }
        }
        // console.log('didMountExit', this.inputElem);
        // with inputElem set up, sync up input
        if (!this.kbdTarget) {
            this.kbdTarget = this.inputElem;
            // console.log('kbdTarget', this.kbdTarget);
            this.setInputs(this.input);
        }
        
    }
    
    componentDidUpdate() {
    }

    async startNewGame() {
        this.guessList = [];
        this.setInputs('');
        this.hintHandler = HintHandler.getHintHandler(this);
        await this.buildWordList(this.settings.wordlen);
        this.possibleList = Array.from(this.wordList);
        this.answer = this.wordList[Math.floor(Math.random() * this.wordList.length)].toUpperCase();
        this.answer = 'FRIZZ';
        this.totalGuesses = 0;
        if (this.settings.startWithReveal) {
            const inputAry = Array(this.settings.wordlen).fill(WILDCHAR);
            const revealPos = this.findRevealPos();
            inputAry[revealPos] = this.answer[revealPos];
            this.setInputs(inputAry.join(''));
            const posMap = this.doCompare(this.input, this.answer);
            this.guessList.push({
                guess: this.input,
                index : this.guessList.length,
                posMap,
            });
            this.possibleList = this.getNewPossibleList(this.input, posMap);
            this.setInputs('');
            this.totalGuesses = 1;
        }
        // console.log('this.answer =', this.answer);
        this.gameOver = false;
        this.setState({
            input: this.input,
            guessList: this.guessList,
            gameOver: false,
            totalGuesses: this.totalGuesses,
            message: null,
        });
        this.prevDataLength = 0;
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
            else if (bchars[index] === WILDCHAR || gchar === WILDCHAR) {
                posMap[index] = UNKNOWN;
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

    setInputs(str) {
        // console.log(`setInputs: ${str}`, this.kbdTarget);
        // if (this.inputElem.current) console.log(this.inputElem.current);
        this.input = str;
        if (this.kbdTarget) this.kbdTarget.value = str;
    }
    
    async doInputSubmit() {
        let legalGuess = true;  // assume this
        if (this.input.length !== this.answer.length) return;
        this.totalGuesses++;
        // console.log('usedHintsObj', usedHintsObj);
        if (this.settings.guessMustBeWord && !this.wordList.includes(this.input)) {
            // await this.tempAlert('Guess must be a Legal Scrabble Word', 1500);
            const addon = (this.input.endsWith('S') && !this.settings.allowPlurals ? ', plurals are disabled' : '');
            this.setMessage(`Guess must be in wordlist${addon}`);
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
                this.message = await this.buildGameOverMessage();
                this.setState(
                    {gameOver:true,
                     message: this.message,
                    });
            }
            else {
                this.message = '';
                this.setState(
                    {gameOver:false,
                     message: this.message,
                    });
            }
        }
        // clean up input for the next time thru
        if (legalGuess) {
            this.setInputs('');
            if (this.settings.useVirtKeyboard) this.keyboard.clearInput();
        }
        else {
            this.illegalGuessCount++;
            this.setState({
                totalGuesses: this.totalGuesses,
            });
        }
        this.setState({
            input: this.input,
            guessList: this.guessList,
        });

        // handle the fact that embedded objects need their fields in the list
        // the last fields are from guessList objects (shown explicitly in case the list is empty)
        const filteredFieldNames =  [...savedGameFields, ...Object.keys(this.settings), 'guess', 'index', 'posMap', 'html', 'def', 'bgcolor'];
        const JSONstring = JSON.stringify(this, filteredFieldNames);
        window.localStorage[savedGameStorageName] = JSONstring;
        // console.log('JSONstring:', JSON.stringify(this, filteredFieldNames, 2));
        // console.log(`message: ${this.message}`);
    }

    commonKeyHandler(key) {
        // console.log(`key=${key}`);
        if (this.state.gameOver) return;
        if (key === '?') console.log('this.answer =', this.answer);
        if (key === 'Backspace' && this.state.message != null) {
            this.setState({message: null});
        }
        if (['Enter', '{enter}'].includes(key)) {
            this.doInputSubmit();
        }
        else if (key === 'Backspace' && this.input.length > 0) {
            this.setInputs(this.input.slice(0, -1));
            this.setState({ input: this.input });
        }
        else {
            key = key.toUpperCase();
            if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(key)) {
                this.setInputs(this.input + key);
                if (this.input.length > this.answer.length) {
                    this.setInputs(this.input.substring(0, this.answer.length));
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
        this.kbdTarget = event.nativeEvent.target;
        // console.log("RealKeyDown", key, this.kbdTarget);
        if (false) {
            const msgtxt = `Real Key Down ${key}`;
            this.logMsg = msgtxt;
            // console.log(msgtxt);
            if (key === 'Enter') this.setMessage(msgtxt);
        }
        if (key === 'Enter' && this.input.length === this.answer.length) {
            this.commonKeyHandler(key);
        }
    }

    onInput(event) {
        let key = null;
        this.kbdTarget = event.nativeEvent.target;
        const natEvent = event.nativeEvent;
        const targ = natEvent.target;
        const newval = targ.value;
        const inputType = natEvent.inputType;
        // console.log(`natEvent: ${targ} ${inputType} ${newval} ${this.input}`);
        if (['insertText',
             'insertCompositionText',
             'deleteContentBackward'].includes(inputType)) {
            if (newval.length > this.input.length)
                key = newval[newval.length - 1];
            else if (newval.length < this.input.length) {
                key = 'Backspace';
            }
        }
        if (false) {
            const msgtxt = `; onInput ${inputType} ${newval} ${key}`;
            this.logMsg += msgtxt;
            console.log(msgtxt);
        }
        if (key !== null) this.commonKeyHandler(key);
    }

    // called when focus leaves our input element so we can put it back
    onBlur(event) {
        if (this.inputElem) {
            this.inputElem.focus();
        }
    }
    
    onChange(event) {
        if (false) {
            this.kbdTarget = event.nativeEvent.target;
            const natEvent = event.nativeEvent;
            const targ = natEvent.target;
            const newval = targ.value;
            const inputType = natEvent.inputType;
            const msgtxt =  `; onChange ${inputType} ${newval}`;
            this.logMsg += msgtxt;
            console.log(msgtxt);
            this.setMessage(this.logMsg);
            this.logMsg = '';
            this.commonKeyHandler('Enter');
        }
    }

    findRevealPos() {
        let maxLength = 0;
        let revealPos = 0;
        [...this.answer].forEach( (ch, index) => {
            // skip if in mark chars mode and char is already green
            const shouldSkip = (!this.settings.noMarkGuessChars &&
                                this.guessList.length > 0 &&
                                this.guessList[this.guessList.length - 1].posMap[index] === EXACT);
            if (!shouldSkip) {
                const newList = this.possibleList.filter( (word) => word[index] === ch);
                // console.log(`knowing ${ch} at pos ${index} reduces possibleList from ${this.possibleList.length} to ${newList.length}`);
                if (newList.length > maxLength) {
                    maxLength = newList.length;
                    revealPos = index;
                }
            }
        });
        return revealPos;
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

    newGameButton() {
        return (
            <button
              onClick = {this.startNewGame.bind(this)}
              style = {{
                  marginLeft: '5px',
                  marginRight: '10px',
              }}
            >
              New
            </button>
        );
    }

    newButtonLine() {
        let legalGuessCount = (this.state.guessList ? this.state.guessList.length : 0);
        // if (this.settings.startWithReveal) legalGuessCount--;
        const guessesText = (this.totalGuesses === 0 ? '' :
                             `Guesses: ${this.totalGuesses}, (${legalGuessCount} Legal)`);
              
        return (
            <Fragment>
              {this.newGameButton()}
                {guessesText}
            </Fragment>
        );
    }

    async getDefinition() {
        const word = this.input;
        // make a req to the api
        const result = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
        );
        if (!result.ok) {
            // alert("No definition found");
            return null;
        }
        const data = await result.json();
        // console.log(data);
        return `(${data[0].meanings[0].partOfSpeech}): ${data[0].meanings[0].definitions[0].definition}`;
    }
    
    async buildGameOverMessage() {
        // const numGuesses = this.state.guessList.length;
        var html = `Match!!`;
        const def = await this.getDefinition();
        return {html: html,
                def: def,
                bgcolor: 'white',
               };
    }
    
    setMessage(html, bgcolor='pink') {
        const msgObj = {html, bgcolor};
        // console.log('setMessage', msgObj);
        this.message = msgObj;
        this.setState({
            message: msgObj,
        });
    }
    
     genMessageLine() {
         // console.log('state.message', this.state.message);
         if (!this.state.message) return (<Fragment></Fragment>);
         const buttonJsx = (this.state.message.msgButton === null ?
                           (<Fragment></Fragment>) :
                            this.state.message.msgButton);
         const defhtml = (this.state.message.def ? `${this.state.message.def}` : '');
         return(
             <div style={{backgroundColor : this.state.message.bgcolor}} >
               {<>{this.state.message.html}</>}
               {<p><small><small>{defhtml}</small></small></p>}
             {buttonJsx}
             </div>
         );
    }

    getPoolChars() {
        return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => this.notInPool[c] !== 1);
    }

    getInputElem() {
         return(
             <input
               type = 'text'
               style = {{opacity:0.05,
                         marginLeft: '5px',
                         fontSize: '1px',
                         // we used to put this up at the top but now is at the bottom (where input focus is)
                         // position: 'absolute',
                         // top: '0px',
                         // left: '30px',
                        }}
               width = '100px'
               ref = {elem => this.inputElem = elem}
               tabIndex = {0}
               autoFocus
               onInput={this.onInput.bind(this)}
               onKeyDown = {this.onRealKeyDown.bind(this)}
               onBlur = {this.onBlur.bind(this)}
             />
         );
    }
    
    render() {
        // console.log('render', this.state);
        if (!this.state || Object.keys(this.state).length === 0) return null;
        this.hintHandler = HintHandler.getHintHandler(this);  // in case it got changed on settings change
        this.yellowString = ' ';
        this.greenString = ' ';
        this.greyString = ' ';
        this.notInPool = {};
        let guessLines = [];
        this.guessJsxIndex = 0;
        if (this.state.guessList) {
            this.state.guessList.forEach( (guessObj) => {
                guessLines.push(<Fragment key={this.guessJsxIndex++}>{this.formatGuess(guessObj, true)}</Fragment>);
                guessLines.push(<br key={this.guessJsxIndex++}/>);
            });
        }
        // sync up this.input and this.inputElem.value
        this.setInputs(this.input);
        // if game not over, push inputty line as well
        if (!this.state.gameOver && this.state.input !== undefined) {
            const newObj = {
                guess: this.state.input,
                posMap: new Array(this.settings.wordlen).fill(NOTUSE),
            };
            guessLines.push(this.formatGuess(newObj, false));
        }

        const poolLine = (!this.state.guessList || this.state.guessList.length === 0 || this.gameOver ?
                          <Fragment></Fragment> :
                          <div>
                            {`Pool: ${this.getPoolChars().join(' ')}`}
                            <br/>
                          </div>
                         );

        const gamePage = () => {
            return (
                <Fragment>
                  <div  style={{position:'relative'}}>
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
                  <div>
                    {guessLines}
                    {this.genMessageLine()}
                  </div>
                  {poolLine}
                  {this.newButtonLine()}
                  {this.getInputElem()}
                  <br/>
                  {this.getVirtKeyboard()}
                </Fragment>
            );
        }

        return (
            this.state.useGamePage ?
                gamePage() :
                <SettingsPage  gameObj={this} inSettings={{...this.settings}}/>
        );
    }
}

export {Game, EXACT, WRONG, NOTUSE, UNKNOWN, EXACTBIT, WRONGBIT, NOTUSEBIT, WILDCHAR};
