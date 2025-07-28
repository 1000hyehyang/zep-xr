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

const STATE_INIT = 3000;
const STATE_READY = 3001;
const STATE_PLAYING = 3002;
const STATE_JUDGE = 3004;
const STATE_END = 3005;

// 스프라이트 로드
let red = App.loadSpritesheet('red.png');
let blue = App.loadSpritesheet('blue.png');
let tomb = App.loadSpritesheet('tomb.png');

let _start = false;
let _gameEnd = false;
let _state = STATE_INIT;
let _stateTimer = 0;
let _timer = 90;

let _objects = {};

// 점수 시스템 제거 (영역 점유 게임이 아니므로)

// 해시 키 사용을 위한 상수
let HEIGHT_KEY = 10000000;

let _blueTeam = [];
let _redTeam = [];

let _players = App.players; // App.players : 전체 플레이어 가져오기
let TEAM_COUNTER = 0;
let _resultStr = '';

// 게임 설정
const MAX_PLAYERS = 6;  // 최대 플레이어 수 (3 vs 3)
const MIN_PLAYERS = 1;  // 개발 모드: 최소 플레이어 수 (1명만 있어도 시작)
const PLAYERS_PER_TEAM = 3; // 팀당 플레이어 수

// NPC 설정 (개발 모드용)
const NPC_COUNT = 1; // 생성할 NPC 수 (공격 테스트용 허수아비 1명)
const NPC_NAMES = [
    "허수아비"
];

// NPC 생성 함수
const createNPC = (name, x, y) => {
    // NPC 플레이어 객체 생성
    let npc = {
        id: "npc_" + name,
        name: name,
        tileX: x,
        tileY: y,
        dir: 0,
        moveSpeed: 80,
        sprite: blueman, // 파란팀 캐릭터 스프라이트 사용
        tag: {
            x: x,
            y: y,
            sturn: false,
            sTime: 1,
            super: false,
            team: 1, // 파란팀으로 고정 (공격 테스트용)
            isNPC: true
        },
        // NPC 메서드들
        sendUpdated: function() {
            // NPC 업데이트 (실제로는 아무것도 하지 않음)
        },
        spawnAt: function(tileX, tileY, dir = 0) {
            this.tileX = tileX;
            this.tileY = tileY;
            this.dir = dir;
            this.tag.x = tileX;
            this.tag.y = tileY;
        }
    };
    
    return npc;
};

// NPC들 생성
let _npcs = [];
let _allPlayers = []; // 실제 플레이어 + NPC들

function startState(state)
{
    _state = state;
    _stateTimer = 0;

    switch(_state)
    {
        case STATE_INIT:
            _start = true;
            _stateTimer = 0;
            _timer = 90;

            // 점수 초기화 제거
            _objects = {};
            _redTeam = [];
            _blueTeam = [];
            TEAM_COUNTER = 0;

            // 실제 플레이어 + NPC 모두 처리
            for(let i in _allPlayers) {
                let p = _allPlayers[i];
                p.tag = {
                    x: p.tileX,
                    y: p.tileY,
                    sturn : false,
                    sTime : 1,
                    super : false,
                    team: p.tag ? p.tag.team : Math.floor(TEAM_COUNTER / PLAYERS_PER_TEAM),
                    isNPC: p.tag ? p.tag.isNPC : false
                };

                TEAM_COUNTER++;

                if(p.tag.team == 0)
                    _redTeam.push(p);
                else if(p.tag.team == 1)
                    _blueTeam.push(p);

                // 실제 플레이어만 스프라이트 설정
                if (!p.tag.isNPC) {
                    p.sprite = p.tag.team == 0 ? redman : blueman;
                    p.sendUpdated();
                }
            }
            break;
        case STATE_READY:
            for(let i in _allPlayers) {
                let p = _allPlayers[i];
                if (!p.tag.isNPC) {
                    p.moveSpeed = 0;
                    p.sendUpdated();
                }
            }
            break;
        case STATE_PLAYING:
            for(let i in _allPlayers) {
                let p = _allPlayers[i];
                if (!p.tag.isNPC) {
                    p.moveSpeed = 80;
                    p.sendUpdated();
                }
            }
            break;
        case STATE_JUDGE:
            for(let i in _allPlayers) {
                let p = _allPlayers[i];
                if (!p.tag.isNPC) {
                    p.moveSpeed = 0;
                    p.sendUpdated();
                }
            }
            break;
        case STATE_END:
            _start = false;

            for(let i in _allPlayers) {
                let p = _allPlayers[i];
                if (!p.tag.isNPC) {
                    p.moveSpeed = 80;
                    p.title = null;
                    p.sprite = null;
                    p.sendUpdated();
                }
            }

            // 젭스크립트로 생성된 모든 오브젝트를 제거
            Map.clearAllObjects();
            break;
    }
}

// NPC 초기화
const initNPCs = () => {
    _npcs = [];
    _allPlayers = [...App.players]; // 실제 플레이어들 복사
    
    // NPC 생성 (허수아비 1명)
    let npc = createNPC(
        NPC_NAMES[0], 
        23, // X 좌표 (고정 위치)
        38  // Y 좌표 (고정 위치)
    );
    _npcs.push(npc);
    _allPlayers.push(npc);
    
    // 허수아비를 맵에 오브젝트로 배치 (체력 시스템 포함)
    Map.putObjectWithKey(23, 38, blueman, {
        npcProperty: { 
            name: "허수아비", 
            hpColor: 0x03ff03, 
            hp: 100, 
            hpMax: 100 
        },
        overlap: true,
        collide: true, // 공격 가능하도록 설정
        key: "scarecrow_npc",
        useDirAnim: true,
        offsetX: -8,
        offsetY: -32
    });
    
    // 허수아비 애니메이션 시작
    Map.playObjectAnimationWithKey("scarecrow_npc", "down", -1);
    
    App.showCenterLabel(`개발 모드: 허수아비가 생성되었습니다.\n공격 테스트를 위해 Z키로 허수아비를 공격해보세요!`);
};

App.onStart.Add(function(){
    // 개발 모드: NPC 초기화
    initNPCs();
    
    // 개발 모드에서는 플레이어 수 제한 없이 시작
    startState(STATE_INIT);
});

// 플레이어가 스페이스에 입장했을 때 이벤트
App.onJoinPlayer.Add(function(p) {
    // 실제 플레이어 추가
    _allPlayers.push(p);
    
    p.tag = {
        x: p.tileX,
        y: p.tileY,
        sturn : false,
        sTime : 1,
        super : false,
        team: Math.floor(TEAM_COUNTER / PLAYERS_PER_TEAM),
        isNPC: false
    };

    if(p.tag.team == 0)
        _redTeam.push(p);
    else if(p.tag.team == 1)
        _blueTeam.push(p);

    TEAM_COUNTER++;
    p.nameColor = p.tag.team == 0 ? 16711680 : 255;
    p.sprite = p.tag.team == 0 ? redman : blueman;
    p.sendUpdated();
});

// 플레이어가 스페이스를 나갔을 때 이벤트
App.onLeavePlayer.Add(function(p) {
    p.moveSpeed = 80;
    p.title = null;
    p.sprite = null;
    p.sendUpdated();

    _players = App.players; // 업데이트(dt)를 위한 모든 플레이어 업데이트
});

// 플레이어가 오브젝트와 부딪혔을 때 이벤트
App.onDestroy.Add(function() {
    Map.clearAllObjects();
})

// 플레이어가 다른 플레이어를 공격했을 때 이벤트 (Z키)
App.onUnitAttacked.Add(function(sender, x, y, target) {
    if(_state != STATE_PLAYING)
        return;

    // NPC는 공격하지 않음
    if(target.tag && target.tag.isNPC) return;

    // 스턴상태가 아니고, 무적이 아니고, 같은 팀이 아니면 스턴을 건다
    if(!target.tag.sturn && sender.tag.team != target.tag.team && !target.tag.super)
    {
        target.tag.sturn = true;
        target.moveSpeed = 0;
        target.sendUpdated();
    }
});

// 허수아비 공격 이벤트 (체력 시스템 - 무한 부활)
App.onAppObjectAttacked.Add(function(sender, x, y, layer, key) {
    if(key === "scarecrow_npc") {
        const targetObject = Map.getObjectWithKey(key);
        targetObject.npcProperty.hp -= 10;
        
        if(targetObject.npcProperty.hp > 0) {
            const hpPercentage = targetObject.npcProperty.hp / targetObject.npcProperty.hpMax;
            
            // 체력에 따른 색상 변경
            if (hpPercentage < 0.3) {
                targetObject.npcProperty.hpColor = 0xff0000; // 빨간색
            } else if (hpPercentage < 0.7) {
                targetObject.npcProperty.hpColor = 0xffa500; // 주황색
            }
            
            targetObject.sendUpdated();
            App.showCenterLabel(`허수아비 체력: ${targetObject.npcProperty.hp}/${targetObject.npcProperty.hpMax}`);
        } else {
            // 체력이 0이 되면 허수아비 부활
            targetObject.npcProperty.hp = targetObject.npcProperty.hpMax;
            targetObject.npcProperty.hpColor = 0x03ff03; // 초록색으로 복원
            targetObject.sendUpdated();
            App.showCenterLabel("허수아비가 부활했습니다! 계속 공격해보세요!");
        }
    }
});

// 20ms마다 호출되는 업데이트
// param1 : deltatime (경과 시간)
App.onUpdate.Add(function(dt) {
    if(!_start)
        return;

    _stateTimer += dt;

    switch(_state)
    {
        case STATE_INIT:
            App.showCenterLabel("개발 모드: 허수아비 공격 테스트");
            
            if(_stateTimer >= 5)
            {
                startState(STATE_READY);
            }
            break;
        case STATE_READY:
            App.showCenterLabel("게임이 곧 시작됩니다.");
            if(_stateTimer >= 3)
            {
                startState(STATE_PLAYING);
            }
            break;
        case STATE_PLAYING:
            App.showCenterLabel(_timer +  `\n개발 모드 - 허수아비 공격 테스트`);
            if(_stateTimer >= 1) {
                _stateTimer = 0;
                _timer--;
            }

            // 시간 종료
            if(_timer <= 0)
            {
                // 모든 플레이어 정리
                for(let i in _allPlayers) {
                    let p = _allPlayers[i];
                    if (!p.tag.isNPC) {
                        p.title = null;
                        p.sprite = null;
                        p.sendUpdated();
                    }
                }
                _resultStr = '개발 모드 테스트 완료!';
                startState(STATE_JUDGE);
            }
            else
            {
                for(let i in _allPlayers) {
                    let p = _allPlayers[i];
                    
                    // NPC는 처리하지 않음
                    if(p.tag && p.tag.isNPC) continue;
                    
                    // 속도 버프 제거 (영역 점유 게임이 아니므로)

                    // 스턴 상태 확인
                    if(p.tag.sturn)
                    {
                        p.tag.sTime -= dt;
                        if(p.tag.sTime <= 0)
                        {
                            p.tag.sturn = false;
                            p.tag.super = true;
                            p.tag.sTime = 1;
                            p.moveSpeed = 80;
                            p.sendUpdated();
                        }
                    }

                    // 무적 상태 확인
                    if(p.tag.super)
                    {
                        p.tag.sTime -= dt;
                        if(p.tag.sTime <= 0)
                        {
                            p.tag.super = false;
                            p.tag.sTime = 1;
                            p.sendUpdated();
                        }
                    }

                    // 플레이어 위치 업데이트
                    if(p.tag.x != p.tileX || p.tag.y != p.tileY) {
                        p.tag.x = p.tileX;
                        p.tag.y = p.tileY;
                    }
                }
            }
            break;
        case STATE_JUDGE:
            App.showCenterLabel(_resultStr);

            if(_stateTimer >= 5)
            {
                startState(STATE_END);
            }
            break;
        case STATE_END:
            break;
    }
});