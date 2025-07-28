/**  
 * 코드 정리 목록
- getMvp(), mostkill() 삭제
- 자기장 관련 코드 삭제
- 팀전 관련 코드 삭제
- player tag삭제 : inPoisonTime, team, killcnt
- 이미지, 위젯 파일 이름 변경
*/

let ghost = App.loadSpritesheet("ghost.png", 32, 48, {
	left: [2],
	right: [1],
	up: [3],
	down: [0],
});

let redBoxing = App.loadSpritesheet("redBoxing.png");

const STATE_INTRO = 3001;
const STATE_INIT = 3002;
const STATE_RULE = 3003;
const STATE_PLAYING = 3004;
const STATE_JUDGE = 3005;
const STATE_END = 3006;

let lastSurvivor = null;
let _start = false;
let _players = App.players;

let _state = STATE_INIT;
let _stateTimer = 0;

let _alive = 0;

let _widget = null;

App.onStart.Add(function () {
	startState(STATE_INTRO);
});

App.onJoinPlayer.Add(function (p) {
	p.tag = {
		widget: null,
		alive: true,
		hp: 5,
		shield: false,
		time: 1, // 피격 후 1초간 무적 상태를 설정하기 위한 속성
	};

	p.attackSprite = redBoxing;

	// 게임 시작 후 새로운 플레이어 입장시 해당 플레이어를 죽음으로 처리
	if (_start) {
		p.moveSpeed = 5;
		p.sprite = ghost;
		p.tag.alive = false;
		p.sendUpdated();
	}

	_players = App.players;
});

App.onLeavePlayer.Add(function (p) {
	p.attackSprite = null;
	p.title = null;
	p.sprite = null;
	p.moveSpeed = 80;
	p.sendUpdated();

	_players = App.players;
});

function init() {
	for (let i in _players) {
		let p = _players[i];
		setHPgage(p, p.tag.hp);
		p.sendUpdated();
	}

	_alive = checkSuvivors();
}

function startState(state) {
	_state = state;
	_stateTimer = 0;
	switch (_state) {
		case STATE_INTRO:
			for (let i in _players) {
				let p = _players[i];
				if (p.tag.widget) {
					p.tag.widget.destroy();
					p.tag.widget = null;
				}
			}
			// 게임시작
			_start = true;
			_widget = App.showWidget("intro.html", "middle", 350, 340);
			App.playSound("intro.wav");
			break;
		case STATE_INIT:
			init();
			break;
		case STATE_RULE:
			_widget = App.showWidget("rule.html", "middle", 400, 200);

			for (let i in _players) {
				let p = _players[i];
				p.moveSpeed = 0;
				p.sendUpdated();
			}
			break;
		case STATE_PLAYING:
			if (_widget) {
				_widget.destroy();
				_widget = null;
			}

			_widget = App.showWidget("status.html", "top", 700, 300);

			for (let i in _players) {
				let p = _players[i];
				p.moveSpeed = 80;
				p.sendUpdated();
			}

			break;
		case STATE_JUDGE:
			break;
		case STATE_END:
			if (_widget) {
				_widget.destroy();
				_widget = null;
			}

			_start = false;

			for (let i in _players) {
				let p = _players[i];
				p.sprite = null;
				p.attackSprite = null;
				p.title = null;
				p.sprite = null;
				p.moveSpeed = 80;
				p.sendUpdated();
			}

			Map.clearAllObjects();
			break;
	}
}

// 체력바 표시 함수
function setHPgage(p, hp) {
	switch (hp) {
		case 5:
			p.title = "▮▮▮▮▮";
			break;
		case 4:
			p.title = "▮▮▮▮";
			break;
		case 3:
			p.title = "▮▮▮";
			break;
		case 2:
			p.title = "▮▮";
			break;
		case 1:
			p.title = "▮";
			break;
	}
}

// 생존자 수 체크 함수
function checkSuvivors() {
	let alive = 0;
	for (let i in _players) {
		let p = _players[i];
		if (p.tag.alive) {
			lastSurvivor = p;
			++alive;
		}
	}
	return alive;
}

// 다른 플레이어를 때릴 때
App.onUnitAttacked.Add(function (sender, x, y, target) {
	if (_state != STATE_PLAYING) return;

	// 공격자가 죽은 상태이면 return
	if (!sender.tag.alive) return;

	// 타겟이 살아 있는 상태이면서 shield가 false인 경우
	if (target.tag.alive && !target.tag.shield) {
		target.tag.hp--; // 타겟의 체력이 1 만큼 감소

		// 타겟의 체력이 0이된 경우
		if (target.tag.hp == 0) {
			target.title = null; // 타이틀 삭제
			target.tag.alive = false; // alive 속성 false
			target.sprite = ghost; // 캐릭터 이미지를 ghost로 변경
			target.moveSpeed = 5; // moveSpeed 80 -> 5
			target.sendUpdated(); // 타겟 속성 업데이트

			_alive = checkSuvivors();
			// 생존자가 1명이면
			if (_alive == 1) {
				if (_widget) {
					_widget.destroy();
					_widget = null;
				}
				// 접속중인 모든 플레이어에게 result.html 위젯을 보여줌
				_widget = App.showWidget("result.html", "top", 1055, 500);
				// 위젯에 표시할 마지막 생존자의 닉네임을 전달
				_widget.sendMessage({
					alive: _alive,
					name: lastSurvivor.name,
				});

				App.playSound("result.wav");

				_stateTimer = 0;
				startState(STATE_JUDGE);
			}
		} else {
			// 타겟을 공격하면 타겟이 1초간 무적 상태가 됨. (shield = true)
			target.tag.shield = true;
			setHPgage(target, target.tag.hp);
			target.sendUpdated();
		}
	}
});

App.onUpdate.Add(function (dt) {
	if (!_start) return;

	_stateTimer += dt;
	switch (_state) {
		case STATE_INTRO:
			// intro.html 위젯을 5초 동안 표시하고 STATE_INIT 시작
			if (_stateTimer >= 5) {
				if (_widget) {
					_widget.destroy();
					_widget = null;
				}
				App.stopSound();

				startState(STATE_INIT);
			}
			break;
		case STATE_INIT:
			startState(STATE_RULE);
			break;

		// rule.html 위젯을 3초 동안 표시하고 STATE_PLAYING 시작
		case STATE_RULE:
			if (_stateTimer >= 3) {
				if (_widget) {
					_widget.destroy();
					_widget = null;
				}
				startState(STATE_PLAYING);
			}
			break;

		case STATE_PLAYING:
			// status.html 위젯의 생존자 수 업데이트
			if (_widget) {
				_widget.sendMessage({
					suvivors: _alive,
				});
			}

			for (let i in _players) {
				let p = _players[i];

				// 플레이어가 죽은 상태라면 건너뜀
				if (!p.tag.alive) continue;

				// 피격 후 1초가 지나면 shield 속성을 false로 변경
				if (p.tag.shield) {
					p.tag.time -= dt;
					if (p.tag.time <= 0) {
						p.tag.shield = false;
						p.tag.time = 1; // shield 지속시간 1초로 초기화
					}
				}
			}

			_alive = checkSuvivors();

			// 생존자가 1명 또는 0명일 경우 result.html 위젯 표시
			if (_alive == 1) {
				if (_widget) {
					_widget.destroy();
					_widget = null;
				}

				_widget = App.showWidget("result.html", "top", 1055, 500);
				_widget.sendMessage({
					alive: _alive,
					name: lastSurvivor.name,
				});

				App.playSound("result.wav");
				startState(STATE_JUDGE);
			} else if (_alive == 0) {
				if (_widget) {
					_widget.destroy();
					_widget = null;
				}

				_widget = App.showWidget("result.html", "top", 1055, 500);
				_widget.sendMessage({
					alive: _alive,
				});

				App.playSound("result.wav");
				startState(STATE_JUDGE);
			}

			break;
		//result.html 위젯을 5초 동안 표시하고 STATE_END 시작
		case STATE_JUDGE:
			if (_stateTimer >= 5) {
				startState(STATE_END);
			}
			break;
		case STATE_END:
			break;
	}
});

// Game Block이 파괴 될 때 실행되는 함수
App.onDestroy.Add(function () {
	// 앱으로 설치된 모든 오브젝트 삭제
	Map.clearAllObjects();
});
