// 히스토리아 게임 시스템

// 스프라이트 로드
let redman = App.loadSpritesheet('redman.png', 48, 64, {
    left: [5, 6, 7, 8, 9],       // 기본 애니메이션 정의
    up: [15, 16, 17, 18, 19],    // 기본 애니메이션 정의
    down: [0, 1, 2, 3, 4],       // 기본 애니메이션 정의
    right: [10, 11, 12, 13, 14], // 기본 애니메이션 정의
}, 8);

// 스프라이트 로드
let blueman = App.loadSpritesheet('blueman.png', 48, 64, {
    left: [5, 6, 7, 8, 9],
    up: [15, 16, 17, 18, 19],
    down: [0, 1, 2, 3, 4],
    right: [10, 11, 12, 13, 14],
}, 8);

// 스프라이트 로드
let red = App.loadSpritesheet('red.png');
let blue = App.loadSpritesheet('blue.png');
let tomb = App.loadSpritesheet('tomb.png');

// 게임 상태
let _start = false;
let _gameEnd = false;
let _state = 0;
let _stateTimer = 0;
let _timer = 90;
let _objects = {};
let _redScore = 0;
let _blueScore = 0;
let _blueTeam = [];
let _redTeam = [];
let _players = App.players;
let TEAM_COUNTER = 0;
let _resultStr = '';

// 해시 키 사용을 위한 상수
let HEIGHT_KEY = 10000000;

// 게임 상태 관리 함수
function startState(state) {
    _state = state;
    _stateTimer = 0;

    switch(_state) {
        case 0: // 초기화
            _start = true;
            _stateTimer = 0;
            _timer = 90;
            _redScore = 0;
            _blueScore = 0;
            _objects = {};
            _redTeam = [];
            _blueTeam = [];
            TEAM_COUNTER = 0;

            for(let i in _players) {
                let p = _players[i];
                p.tag = {
                    x: p.tileX,
                    y: p.tileY,
                    sturn : false,
                    sTime : 1,
                    super : false,
                    team: Math.floor(TEAM_COUNTER / 3), // 3 vs 3 팀 배정
                };

                TEAM_COUNTER++;

                if(p.tag.team == 0)
                    _redTeam.push(p);
                else if(p.tag.team == 1)
                    _blueTeam.push(p);

                p.sprite = p.tag.team == 0 ? redman : blueman;
                p.sendUpdated();
            }
            break;
        case 1: // 준비
            for(let i in _players) {
                let p = _players[i];
                p.moveSpeed = 0;
                p.sendUpdated();
            }
            break;
        case 2: // 게임 진행
            for(let i in _players) {
                let p = _players[i];
                p.moveSpeed = 80;
                p.sendUpdated();
            }
            break;
        case 3: // 결과 판정
            for(let i in _players) {
                let p = _players[i];
                p.moveSpeed = 0;
                p.sendUpdated();
            }
            break;
        case 4: // 종료
            _start = false;
            for(let i in _players) {
                let p = _players[i];
                p.moveSpeed = 80;
                p.title = null;
                p.sprite = null;
                p.sendUpdated();
            }
            Map.clearAllObjects();
            break;
    }
}

// 앱 시작
App.onStart.Add(function(){
    startState(0);
});

// 플레이어 입장
App.onJoinPlayer.Add(function(p) {
    p.tag = {
        x: p.tileX,
        y: p.tileY,
        sturn : false,
        sTime : 1,
        super : false,
        team: Math.floor(TEAM_COUNTER / 3),
    };

    if(p.tag.team == 0)
        _redTeam.push(p);
    else if(p.tag.team == 1)
        _blueTeam.push(p);

    TEAM_COUNTER++;
    p.nameColor = p.tag.team == 0 ? 16711680 : 255;
    p.sprite = p.tag.team == 0 ? redman : blueman;
    p.sendUpdated();

    _players = App.players;
});

// 플레이어 퇴장
App.onLeavePlayer.Add(function(p) {
    p.moveSpeed = 80;
    p.title = null;
    p.sprite = null;
    p.sendUpdated();
    _players = App.players;
});

// 앱 종료
App.onDestroy.Add(function() {
    Map.clearAllObjects();
});

// 플레이어 공격
App.onUnitAttacked.Add(function(sender, x, y, target) {
    if(_state != 2) return;

    if(!target.tag.sturn && sender.tag.team != target.tag.team && !target.tag.super) {
        target.tag.sturn = true;
        target.moveSpeed = 0;
        target.sendUpdated();
    }
});

// 메인 업데이트
App.onUpdate.Add(function(dt) {
    if(!_start) return;

    _stateTimer += dt;

    switch(_state) {
        case 0: // 초기화
            App.showCenterLabel("3 vs 3 팀 게임입니다!\n가장 많은 땅을 칠한 팀이 승리합니다.\n상대팀을 공격하면 1초간 스턴 상태가 됩니다.");
            
            if(_stateTimer >= 5) {
                startState(1);
            }
            break;
        case 1: // 준비
            App.showCenterLabel("게임이 곧 시작됩니다.");
            if(_stateTimer >= 3) {
                startState(2);
            }
            break;
        case 2: // 게임 진행
            App.showCenterLabel(_timer +  `\n빨간팀  VS  파란팀\n` + _redScore + "  VS  " + _blueScore);
            if(_stateTimer >= 1) {
                _stateTimer = 0;
                _timer--;
            }

            if(_timer <= 0) {
                if(_redScore > _blueScore) {
                    for(let i in _players) {
                        let p = _players[i];
                        p.title = null;
                        if(p.tag.team == 1) {
                            p.sprite = tomb;
                            p.moveSpeed = 0;
                            p.sendUpdated();
                        }
                    }
                    _resultStr = '빨간팀  VS  파란팀\n' + _redScore + "  VS  " + _blueScore + '\n빨간팀 승리';
                }
                else if(_redScore < _blueScore) {
                    for(let i in _players) {
                        let p = _players[i];
                        p.title = null;
                        if(p.tag.team == 0) {
                            p.sprite = tomb;
                            p.moveSpeed = 0;
                            p.sendUpdated();
                        }
                    }
                    _resultStr = '빨간팀  VS  파란팀\n' + _redScore + "  VS  " + _blueScore + '\n파란팀 승리';
                }
                else {
                    for(let i in _players) {
                        let p = _players[i];
                        p.title = null;
                        p.sprite = null;
                        p.sendUpdated();
                    }  
                    _resultStr = '빨간팀  VS  파란팀\n' + _redScore + "  VS  " + _blueScore + '\n무승부';
                }
                startState(3);
            }
            else {
                for(let i in _players) {
                    let p = _players[i];
                    
                    // 속도 버프 적용
                    if(_timer == 30 || _timer == 20 || _timer == 10) {
                        if(_redScore > _blueScore) {
                            if(p.tag.team == 1) {
                                p.title = '<SPEED UP>';
                                p.moveSpeed = 90;
                                p.sendUpdated();
                            }
                            else {
                                p.title = null;
                                p.moveSpeed = 80;
                                p.sendUpdated();
                            }
                        }
                        else if(_redScore < _blueScore) {
                            if(p.tag.team == 0) {
                                p.title = '<SPEED UP>';
                                p.moveSpeed = 90;
                                p.sendUpdated();
                            }
                            else {
                                p.title = null;
                                p.moveSpeed = 80;
                                p.sendUpdated();
                            }
                        }
                    }

                    // 스턴 상태 확인
                    if(p.tag.sturn) {
                        p.tag.sTime -= dt;
                        if(p.tag.sTime <= 0) {
                            p.tag.sturn = false;
                            p.tag.super = true;
                            p.tag.sTime = 1;
                            p.moveSpeed = 80;
                            p.sendUpdated();
                        }
                    }

                    // 무적 상태 확인
                    if(p.tag.super) {
                        p.tag.sTime -= dt;
                        if(p.tag.sTime <= 0) {
                            p.tag.super = false;
                            p.tag.sTime = 1;
                            p.sendUpdated();
                        }
                    }

                    // 타일 칠하기 및 점수 업데이트
                    if(p.tag.x != p.tileX || p.tag.y != p.tileY) {
                        p.tag.x = p.tileX;
                        p.tag.y = p.tileY;
                        
                        let oldValue = _objects[p.tileY * HEIGHT_KEY + p.tileX];
                        if(oldValue == p.tag.team)
                            continue;
        
                        if(oldValue == 0) {
                            _redScore--;
                        } else if(oldValue == 1) {
                            _blueScore--;
                        }
        
                        if(p.tag.team == 0)
                            _redScore++;
                        else
                            _blueScore++;
                        
                        _objects[p.tileY * HEIGHT_KEY + p.tileX] = p.tag.team;
                        
                        Map.putObject(p.tileX, p.tileY, p.tag.team == 0 ? red : blue, {
                            overlap: true,
                        });
                    }
                }
            }
            break;
        case 3: // 결과 판정
            App.showCenterLabel(_resultStr);
            if(_stateTimer >= 5) {
                startState(4);
            }
            break;
        case 4: // 종료
            break;
    }
}); 