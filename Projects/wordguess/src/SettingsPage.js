import React, { Component, Fragment } from "react";
import NumericInput from "react-numeric-input";
import {EXACTBIT, WRONGBIT, NOTUSEBIT} from './Game.js';
const nbsp = String.fromCharCode(160);

class SettingsPage extends Component {
    constructor() {
        super();
        this.state = {
            settings : {},
        };
    }
    
    updateSettings(settingName, newval) {
        // update the settings (which is shared between Game and us
        // and set the state so we re-render
        this.settings[settingName] = newval;
        this.setState({settings: this.settings});
    }
    
    getSwitch(settingName) {
        if (true) return (
            <input
              type="checkbox"
              checked={this.settings[settingName]}
              onChange= {() => this.updateSettings(settingName, !this.props.gameObj.settings[settingName])}
              id={settingName}
              height={15}
              width={30}
              style={{float: 'left'}}
            />
        )
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
                  value={this.settings[settingName] || ""} 
                  onChange={(val) => this.updateSettings(settingName, val)}
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
                    this.updateSettings(name, val);
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
        this.gameObj = this.props.gameObj;
        this.settings = this.gameObj.settings;  // shares the Game settings

        return (
            // first is button to return to game
            <div>
              <button
                style = {{
                    marginRight: '10px',
                    marginBottom: '5px',
                }}
                onClick = {() => {
                    this.gameObj.setState({useGamePage:true});
                    this.gameObj.startNewGame();
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
}

export {SettingsPage};
