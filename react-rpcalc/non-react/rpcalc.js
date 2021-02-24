'use strict';
class StackObj {
    constructor(val, operator, ops) {
        this.val = val;
        this.operator = operator;
        this.ops =  (ops == null) ? [] : ops;
    }

    addOpInfo(operator, ops) {
        this.operator = operator;
        this.ops = ops;
    }
    
    toHtmlString() {
	const spaces = '&nbsp;&nbsp;&nbsp;&nbsp;';
        if (this.operator == null) {
            return `${this.val}<br>`
        } else if (this.ops.length == 0) {
	    return `${this.val}${spaces}(${this.operator})<br>`
        } else {
	    let optxt = `(${this.ops[0].val} ${this.operator} ${this.ops[1].val})`;
	    return `${this.val}${spaces}${optxt}<br>`
        }
    }
}

function keyfunc(e) {
    console.log('key:' + e.key);
    if (e.key == 'Enter' && inputElem.value.length == 0) {
        handleInput(prevInstring, inputElem);
    }
}

let mydiv = document.querySelector('#d1');
let vals = [];
for (let n=0; n<3; n++) {
    vals.push(new StackObj(n));
}
updateDiv(mydiv);
const inputElem = document.getElementById('myInput');
inputElem.onkeydown = keyfunc;

function updateDiv(mydiv) {
    mydiv.innerText = '';
    for (let stkobj of vals) {
        mydiv.innerHTML += stkobj.toHtmlString();
    }
    mydiv.scrollTop = mydiv.scrollHeight;
}

let prevInstring = null;
let stkdict = {};

function inputfunc(elem) {
    // check if a number was entered
    console.log(vals);
    let [x, y] = vals.slice(-2);
    let instring = elem.value;
    elem.style.borderColor = 'black';
    handleInput(instring, elem);
}

function handleInput(instring, elem) {
    if ((instring.length == 0) && prevInstring != null) {
        instring = prevInstring;
    }
    prevInstring = instring;
    if (!isNaN(instring)) {
        vals.push(new StackObj(parseFloat(instring)));
    }
    else if ((instring.length == 1) && '+-*/'.includes(instring) && vals.length >= 2) {
        let y = vals.pop();
        let x = vals.pop();
        let oper = instring;
        let newobj = new StackObj(eval(`${x.val} ${oper} ${y.val}`), oper, [x,y])
        vals.push(newobj);
    }
    else if (instring == 'u') {
        // undo what is in last stkobj
        let last = vals.pop();
        for (let op of last.ops) {
            vals.push(op);
        }
    }
    else if (instring[0] == 's') {
        let vname = instring.slice(2);
        stkdict[vname] = vals.slice(-1)[0].val;
    }
    else if (instring[0] == 'r') {
        let vname = instring.slice(2);
        vals.push(new StackObj(stkdict[vname], instring));
    }
    else {
        elem.style.borderColor = 'red';
    }
    elem.value = '';  // clear it out
    updateDiv(mydiv);
}

