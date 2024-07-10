// lvs and ccs
const lvCCs = [
    ['1', ['1.0', '1.5']],
    ['2', ['2.0', '2.5']],
    ['3', ['3.0', '3.5']],
    ['4', ['4.0', '4.5']],
    ['5', ['5.0', '5.5']],
    ['6', ['6.0', '6.5']],
    ['7', ['7.0', '7.5']],
    ['7+', ['7.8']],
    ['8', ['8.0', '8.1', '8.2', '8.3', '8.4', '8.5', '8.6']],
    ['8+', ['8.7', '8.8', '8.9']],
    ['9', ['9.0', '9.1', '9.2', '9.3', '9.4', '9.5', '9.6']],
    ['9+', ['9.7', '9.8', '9.9']],
    ['10', ['10.0', '10.1', '10.2', '10.3', '10.4', '10.5', '10.6']],
    ['10+', ['10.7', '10.8', '10.9']],
    ['11', ['11.0', '11.1', '11.2', '11.3', '11.4', '11.5']],
    ['12', ['12.0']]
    ];


function scoreToScoreMod(sc) {
    if (sc >= 10000000) {
        return 2;
    } else if (sc > 9800000) {
        return 1 + (sc-9800000)/200000;
    } else {
        return (sc-9500000)/300000;
    }
}

function scoreModToScore(sm) {
    if (sm >= 1) {
        return parseInt(9800000 + (sm-1)*200000);
    } else {
        return parseInt(9500000 + sm*300000);
    }
}

function scoreDisp(score) {
    if (score >= 10000000) {
        return "PM";
    } else {
        return score.toLocaleString('en-US').replaceAll(',',"'");
    }
}

function scoreModDisp(sm) {
    let score = scoreModToScore(sm);
    return scoreDisp(score);
}

function scoreRange(goalmin, goalmax, stepstat, cc) {
    let scoremin = 0;
    let scoremax = 0;
    let prminsqrt = (goalmin*50/stepstat - 2.5)/2.45;
    if (prminsqrt < 0) {
        scoremin = 0;
    } else {
        scoremin = scoreModToScore(prminsqrt**2 - cc);
    }
    let prmaxsqrt = (goalmax*50/(stepstat+1) - 2.5)/2.45;
    console.log([goalmax, prmaxsqrt])
    if (prmaxsqrt < 0) {
        return false;
    }
    let smmax = prmaxsqrt**2 - cc;
    if (smmax > 2) {
        scoremax = 10000000;
    } else {
        scoremax = scoreModToScore(smmax);
    }
    console.log([scoremin, scoremax])
    if (scoremin > scoremax) {
        return false; 
    } else {
        return [scoremin, scoremax];
    }
}


// event listener to calculate score ranges on button press
const scorerowscc = document.getElementById("scoresccrows");
const scorerowslv = document.getElementById("scoreslvrows");
const errMsg = document.getElementById("calcerror");
var wew = 0;

function calcScores() {
    var goalmin = parseFloat(document.getElementById("input-goalmin").value);
    var goalmax = parseFloat(document.getElementById("input-goalmax").value);
    var ccmin = parseFloat(document.getElementById("input-ccmin").value);
    var ccmax = parseFloat(document.getElementById("input-ccmax").value);
    var stepstat = parseFloat(document.getElementById("input-partnerstep").value);
    var stamboost = parseInt(document.querySelector('input[name="stam"]:checked').value);
    var fragboost = parseFloat(document.querySelector('input[name="frag"]:checked').value);
    var worldboost = parseFloat(document.querySelector('input[name="world"]:checked').value);
    var mmrboost = parseInt(document.querySelector('input[name="mmr"]:checked').value)
    goalmin = goalmin/(stamboost*fragboost*worldboost*mmrboost);
    goalmax = goalmax/(stamboost*fragboost*worldboost*mmrboost);

    let srs = [];
    for (let [lv, ccs] of lvCCs) {
        let lvsrs = [];
        for (let cc of ccs) {
            sr = scoreRange(goalmin, goalmax, stepstat, cc);
            if (cc < ccmin || cc > ccmax) {
                continue;
            } else if (sr) {
                lvsrs.push([cc, sr]);
            }
        }
        if (lvsrs.length > 0) {
            srs.push([lv, lvsrs])
        }
    }

    let ccRows = [];
    let lvRows = [];
    for (let [lv, lvsrs] of srs) {
        let lvscoremin = 0;
        let lvscoremax = 10000000;
        let ccbase = lvsrs["0"]["0"];
        for ([cc, [scoremin, scoremax]] of lvsrs) {
            lvscoremin = Math.max(lvscoremin, scoremin);
            lvscoremax = Math.min(lvscoremax, scoremax);
            let row = "\t\t<tr";
            if (cc == ccbase) {
                row = row + ' class="trlv"'
            }
            row += `><td>${cc}</td>`
            row += `<td>${scoreDisp(scoremin)} &ndash; ${scoreDisp(scoremax)}</td>`
            row += `<td>${scoreDisp(scoremax-scoremin)}</td></tr>`
            ccRows.push(row);
        }
        if (lvscoremax > lvscoremin) {
            row = `\t\t<tr class="trlv"><td>${lv}</td>`
            row += `<td>${scoreDisp(lvscoremin)} &ndash; ${scoreDisp(lvscoremax)}</td>`
            row += `<td>${scoreDisp(lvscoremax-lvscoremin)}</td></tr>`
            lvRows.push(row);
        }
    }
    scorerowscc.innerHTML = ccRows.join('\n');
    scorerowslv.innerHTML = lvRows.join('\n');

    if (goalmin > goalmax) {
        errMsg.innerText = "步数范围无效";
    } else if (ccmin > ccmax) {
        errMsg.innerText = "等级范围无效";
    } else if (srs.length == 0) {
        let minsteps = (stepstat+1)/50 * 2.5;
        let maxsteps = stepstat/50 * (2.5 + 2.45*(ccmax+2)**0.5);
        let reasons = [];
        if (goalmin > maxsteps) {
            reasons.push("请使用具有更高 STEP 值的搭档")
            if (ccmax < 12) {
                reasons.push("请扩展等级范围")
            }
            if (stamboost > 1 || fragboost > 1) {
                reasons.push("请禁用或调低强化")
            }
        } else if (goalmax < minsteps) {
            reasons.push("请使用具有更低 STEP 值的搭档")
        }
        errstr = "步数范围超出, 尝试下列方法:\n<ul>";
        for (s of reasons) {
            errstr += `\n\t<li>${s}</li>`
        }
        errMsg.innerHTML = errstr;
    } else {
        errMsg.innerText = "";
    }
}


// event listener to switch displayed table
function scoresHandler(x) {
    var tablesArray = Array.from(document.getElementsByClassName('scorestable'));
    tablesArray.forEach(ele => {
        if(ele.id === x) {
            ele.classList.remove("hidden");
        } else {
            ele.classList.add("hidden");
        }
    })
}
