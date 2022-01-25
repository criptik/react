import React, { Component, Fragment } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import NumericInput from "react-numeric-input";
import Switch from "react-switch";
import * as _ from 'underscore';
import "./index.css";

const nbsp = String.fromCharCode(160);
const [EXACT, WRONG, NOTUSE] = [1,2,3];

// abstract class for the different ways of handling hints
class HintHandler {
    constructor(gameObj) {
        if (new.target === HintHandler) {
            throw new TypeError('cannot instantiate HintHandler class');
        }
        // some methods must be overridden
        if (this.computeGuessCharColor === undefined) {
            throw new TypeError(`class ${this.constructor.name} did not implement computeGuessCharColor method`);
        }
        if (this.formatGuessTotals === undefined) {
            throw new TypeError(`class ${this.constructor.name} did not implement formatGuessTotals method`);
        }
        this.gameObj = gameObj;
    }

    arrayEquals(a, b) {
        if (a.length !== b.length) return false;
        a = a.sort();
        b = b.sort();
        return a.every((val, index) => val === b[index]);
    }

    buildPosMap(len, exact, wrongplace) {
        let ary = new Array(len).fill(NOTUSE);
        exact.forEach(pos => ary[pos] = EXACT);
        wrongplace.forEach(pos => ary[pos] = WRONG);
        return ary;
    }

}

// class for handling hints by marking chars
class HintHandlerMarkChars extends HintHandler{
    computeGuessCharColor(guessObj, pos, chval, submitted) {
        let bgcolor = 'white'; // default
        if (guessObj.exact.includes(pos)) {
            bgcolor = 'lightgreen';
            this.gameObj.greenString += ` ${chval}`;
        }
        else if (guessObj.wrongplace.includes(pos)) {
            bgcolor = 'yellow';
            this.gameObj.yellowString += ` ${chval}`;
        }
        else if (submitted) {
            this.gameObj.greyString += ` ${chval}`;
            this.gameObj.notInPool.add(chval);
        }
        return bgcolor;
    }

    // in this handler, we don't show anything at end of line
    formatGuessTotals(guessObj, guessLine) {
    }

    genErrMsg(newCode, oldCode, pos, newGuess, oldGuess) {
        const oldChr = oldGuess[pos];
        if (oldCode === EXACT) return `chr ${pos+1} must be ${oldChr}, `;
        if (newCode === EXACT)  return `chr ${pos+1} must not be ${oldChr}, `;
        if (oldCode === NOTUSE && newCode === WRONG) {
            return `must not use ${oldChr}, `;
        }
        if (newCode === NOTUSE && oldCode === WRONG) {
            return `must contain ${oldChr}, `;
        }
        return `chr ${pos+1} ${newCode} !== ${oldCode}, `;        
    }
    
    checkUseAllHints(newGuess) {
        let retval = true;
        let errMsg = '';
        const len = newGuess.length;
        // for each previous guess, going backwards, see if our guess would produce a similar result
        for (let gidx = this.gameObj.guessList.length-1; gidx >= 0; gidx--) {
            const guessObj = this.gameObj.guessList[gidx];
            const oldPosMap = this.buildPosMap(len, guessObj.exact, guessObj.wrongplace);
            // get compare info for that guess vs. our new guess
            let [newExact, newWrongPlace] = this.gameObj.doCompare(guessObj.guess, newGuess);
            const newPosMap = this.buildPosMap(len, newExact, newWrongPlace);
            console.log(`${guessObj.guess}, ${newPosMap}, ${oldPosMap}`);
            for (let pos=0; pos<len; pos++) {
                const newCode = newPosMap[pos];
                const oldCode = oldPosMap[pos];
                if (newCode !== oldCode) {
                    // errMsg += `chr ${pos+1} ${newCode} !== ${oldCode}, `;
                    errMsg += this.genErrMsg(newCode, oldCode, pos, newGuess, guessObj.guess);
                    retval = false;
                }
            }
            if (retval === false) return `${errMsg} see ${guessObj.guess}`;
        }
        return null;
    }

    // the following 2 routines should eventually go away
    oldCheckUseAllHints(guess) {
        // first we check for green missing and yellow missing if any
        // short circuit in certain situations
        let greenMissing = [];
        let yellowMissing = [];
        const guessAry = [...guess];
        // we will look in the previous input submission record (if any)
        const prevGuessObj = this.gameObj.mostRecentGuess();
        // console.log('prevGuess', prevGuessObj);
        // first check previous exacts
        prevGuessObj.exact.forEach( pos => {
            const chr = prevGuessObj.guess[pos];
            if (guessAry[pos] === chr) {
                // clear so we don't reuse
                guessAry[pos] = null;
            }
            else {
                greenMissing.push(chr);
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
                yellowMissing.push(chr);
            }
        });

        // build local notInPool from all previous guesses
        let localNotInPool = new Set();
        this.gameObj.guessList.forEach((guessObj) => {
            let used = [...guessObj.exact, ...guessObj.wrongplace];
            let unused = _.range(guessObj.guess.length).filter( pos => !used.includes(pos));
            let unusedChars = unused.map(pos => guessObj.guess[pos]);
            unusedChars.forEach(ch => localNotInPool.add(ch));
        });
        let localNotInPoolArray = Array.from(localNotInPool.values());
        console.log(`unusedChars: ${localNotInPoolArray}`);
        // let notInPoolUsed = guessAry.filter( ch => localNotInPoolArray.includes(ch));
        let notInPoolUsed = guessAry.filter( ch => Array.from(this.gameObj.notInPool.values()).includes(ch));
        
        return (greenMissing.length === 0 && yellowMissing.length === 0 && notInPoolUsed.length === 0 ? null :
                this.oldFormatHintsUsedMessage(greenMissing, yellowMissing, notInPoolUsed));
    }
    
    oldFormatHintsUsedMessage(greenMissing, yellowMissing, notInPoolUsed) {
        // build alert message
        const missingGreenComp = (
            <span style={{backgroundColor:'lightgreen'}}>
              {' ' + greenMissing.join(',')}
            </span>);
        const missingYellowComp = (
            <span style={{backgroundColor:'yellow'}}>
              {' '+ yellowMissing.join(',')}
            </span>);

        const missingHintsPart = (greenMissing.length === 0 && yellowMissing.length === 0 ? ' ' :
                                  (<div>
                                     {'Guess must use Hints: '}
                                     {missingGreenComp}
                                     {missingYellowComp}
                                   </div>)
                                 );
                              
        const notUsePart = (notInPoolUsed.length === 0 ? ' ' : ` cannot use ${notInPoolUsed.join(' ')}`);
        
        const hintsMsg = (
            <div>
              {missingHintsPart}
              {notUsePart}
            </div>
        );
        return hintsMsg;
    }
}

// class for handling hints by just showing totals (harder)
class HintHandlerShowTotals extends HintHandler{
    // when we are not marking guess chars, we only know notInPool
    // which is the special case when no green or yellow
    computeGuessCharColor(guessObj, pos, chval, submitted) {
        const bgcolor = 'white';
        if (submitted && (guessObj.exact.length + guessObj.wrongplace.length === 0)) {
            this.gameObj.notInPool.add(chval);
        }
        return bgcolor;
    }

    // in this handler we do show totals at end of guess line
    formatGuessTotals(guessObj, guessLine) {
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

    oldCheckUseAllHints(guess) {
        // for each previous guess, see if we have at least as many total
        // green+yellow chars matching as that guess had.  Complain about the first one
        // that does not hold true.
        const notEnoughs = [];
        const notUses = [];
        for (let gidx = 0; gidx < this.gameObj.guessList.length; gidx++){
            const oldGuessObj = this.gameObj.guessList[gidx];
            const [exact, wrongplace] = this.gameObj.doCompare(guess, oldGuessObj.guess);
            const newLen = exact.length + wrongplace.length;
            const oldLen = oldGuessObj.exact.length + oldGuessObj.wrongplace.length;
            console.log(`old: ex:${oldGuessObj.exact.length} wp:${oldGuessObj.wrongplace.length}, new:  ex:${exact.length} wp:${wrongplace.length}, newlen=${newLen} oldlen=${oldLen}`);
            if (newLen < oldLen) {
                notEnoughs.push(oldGuessObj.guess);
            }
            else if (oldLen === 0 && newLen !== 0) {
                notUses.push(oldGuessObj.guess);
            }
        }
        if (notEnoughs.length === 0 && notUses.length === 0) return null;
        let msg = '';
        if (notEnoughs.length > 0) {
            msg += `not enough chars from ${notEnoughs.join(', ')}. `;
        }
        if (notUses.length > 0) {
            msg += `should not use chars from ${notUses.join(', ')}. `;
        }
        return msg;
    }
}

class Game extends Component {
    constructor() {
        super();
        this.settings = {
            wordlen: 5,
            guessMustBeWord : true,
            noMarkGuessChars : false,            
            hintsMustBeUsed : true,
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
        this.notInPool = new Set();
        this.hintHandler = (this.settings.noMarkGuessChars ? new HintHandlerShowTotals(this) : new HintHandlerMarkChars(this));
        await this.buildWordList(this.settings.wordlen);
        this.answer = this.wordList[Math.floor(Math.random() * this.wordList.length)].toUpperCase();
        this.answer = 'FORDS';
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

    getNotUsedPosAry(exact, wrongplace) {
        const exandwp = [...exact, ...wrongplace]
        return _.range(this.answer.length).filter(pos => !exandwp.includes(pos));
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
    
    
    async doInputSubmit() {
        let legalGuess = true;  // assume this
        if (this.input.length !== this.answer.length) return;
        // console.log('usedHintsObj', usedHintsObj);
        if (this.settings.guessMustBeWord && !this.wordList.includes(this.input)) {
            // await this.tempAlert('Guess must be a Legal Scrabble Word', 1500);
            this.setMessage('Guess must be a Legal Scrabble Word');
            legalGuess = false;
        }
        else if (this.settings.hintsMustBeUsed && this.guessList.length > 0) {
            const messageJsx = this.hintHandler.checkUseAllHints(this.input);
            if (messageJsx) {
                this.setMessage(messageJsx, 'rgb(230,230,230)');
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
            if (exact.length === this.answer.length) {
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
        // console.log(`guessObj: (${guess})`, guessObj.exact, guessObj.wrongplace, 'this.answer', this.answer);
        for (let n=0; n < this.answer.length; n++) {
            const chval = (n < guess.length ? guess[n] : nbsp);
            const bgcolor = this.hintHandler.computeGuessCharColor(guessObj, n, chval, submitted);
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
            <div style={{float: 'left', width:'300px'}}>
            <span style={{fontSize:'16px'}} >{`${labeltext}${nbsp}${nbsp}`} </span>
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
              <span style={{fontSize:'16px'}} >
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
    
    render() {
        // console.log('render', this.state.message, this.focusRef);
        this.yellowString = ' ';
        this.greenString = ' ';
        this.greyString = ' ';
        // this.notInPool = new Set();
        let guessLines = [];
        this.state.guessList.forEach( (guessObj) => {
            guessLines.push(this.formatGuess(guessObj, true));
            guessLines.push(<br/>);
        });
        // if game not over, push inputty line as well
        if (!this.state.gameOver) {
            const newObj = {
                guess: this.state.input,
                exact: [],
                wrongplace: [],
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
                  <div style={{width:'300px', display:'inline-block'}}>
                    {this.genNumericInputSetting('wordlen', 'Word Length? (longer=harder)') }
                    <br/>
                    {this.genSwitchSetting('guessMustBeWord', 'Guess must be word? (harder)') }
                    {this.genSwitchSetting('noMarkGuessChars', 'Not Mark Guess Chars? (much harder)') }
                    {this.genSwitchSetting('hintsMustBeUsed', 'Hints Must Be Used? (harder)') }
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
                    WordGuess Game
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

export default Game;
