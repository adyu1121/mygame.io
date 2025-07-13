// 이미지 및 반지름 추가
import { FRUITS } from "./fruits.js";

// 이미지 미리 불러오는 작업
const loadTexture = async () => {

    const textureList = [
    'image/00_cherry.png',
    'image/01_strawberry.png',
    'image/02_grape.png',
    'image/03_dekopon.png',
    'image/04_persimmon.png',
    'image/05_apple.png',
    'image/06_pear.png',
    'image/07_peach.png',
    'image/08_pineapple.png',
    'image/09_melon.png',
    'image/10_watermelon.png',
    ]
    
    const load = textureUrl => {
    const reader = new FileReader()
    
    return new Promise( resolve => {
    reader.onloadend = ev => {
    resolve(ev.target.result)
    }
    fetch(textureUrl).then( res => {
    res.blob().then( blob => {
    reader.readAsDataURL(blob)
    })
    })
    })
    }
    
    const ret = {}
    
    for ( let i = 0; i < textureList.length; i++ ) {
    ret[textureList[i]] = await load(`${textureList[i]}`)
    }
    
    return ret
    }
    
    const textureMap = await loadTexture()

// 모듈 불러오기
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    World = Matter.World,
    Body = Matter.Body,
    Events = Matter.Events;

// 엔진 선언
const engine = Engine.create();

// 렌더 선언
const render = Render.create
({
    engine,
    // 어디에 그릴 것인지
    element: document.body,
    options: {
        wireframes: false,
        background: '#A1B1E3',
        width: 620,
        height: 850
    }
});

// 벽 배치를 위한 world 선언
const world = engine.world;

// 벽 생성
const leftWall = Bodies.rectangle(15, 395, 30, 790, {
    isStatic: true,
    //render: {fillStyle: "#F611E3"}
    render: {
        sprite: {texture: `image/left wall rotation.png` }
    }
})

const rightWall = Bodies.rectangle(605, 395, 30, 790, {
    isStatic: true,
    render: {
        sprite: {texture: `image/right wall rotation.png` }
    }
})

const ground = Bodies.rectangle(310, 820, 620, 60, {
    isStatic: true,
    render: {
        sprite: {texture: `image/ground.png` }
    }
})

const topLine = Bodies.rectangle(310, 150, 620, 2, {
    // 이벤트 처리를 위한 이름 지정
    name: "topLine",

    isStatic: true,
    isSensor: true,  // 센서 기능
    render: {fillStyle: "#8FE143"}
})

// 생성한 벽을 월드에 배치
World.add(world, [leftWall, rightWall, ground, topLine]);

// 실행
Render.run(render);
Runner.run(engine);

// 현재 과일의 값을 저장하는 변수
let currentBody = null;
let currentFruit = null;

// 키 조작을 제어하는 변수
let disableAction = false;

// 키 제어 변수
let interval = null;

// 과일을 추가하는 함수
function addFruit()
{
    // 난수 생성
    const index = Math.floor(Math.random() * 5);

    const fruit = FRUITS[index];

    const body = Bodies.circle(300, 50, fruit.radius,
        {
            index: index, // 해당 과일의 번호를 저장
            isSleeping: true, // 처음 시작할 때 멈춤
            render: {
                sprite: {
                    texture: `${fruit.name}.png`,
                    xScale: (fruit.radius * 2) / 2544,
                    yScale: (fruit.radius * 2) / 2544
                 }

            },
            restitution: 0.4,
        });

    // 현재 과일의 값 저장
    currentBody = body;
    currentFruit = fruit;
    
    // 월드에 배치
    World.add(world, body);
}

// 키보드 입력 받기
window.onkeydown = (event) => {

    if(disableAction) return;

    switch(event.code)
    {
        case "KeyA": 
            if(interval) return;

            // 인터벌 변수를 사용해서 밀리초 단위로 함수를 반복
            interval = setInterval(() => {
                if(currentBody.position.x - currentFruit.radius > 30) {
                    Body.setPosition(currentBody, {
                        x: currentBody.position.x - 1,
                        y: currentBody.position.y
                    })
                }
            }, 5);
            break;
        case "KeyD":
            if(interval) return;

            // 인터벌 변수를 사용해서 밀리초 단위로 함수를 반복
            interval = setInterval(() => {
                if(currentBody.position.x + currentFruit.radius < 590) {
                    Body.setPosition(currentBody, {
                        x: currentBody.position.x +1,
                        y: currentBody.position.y
                    })
                }
            }, 5);
            break;
        case "KeyS":
            currentBody.isSleeping = false;
            //addFruit();
            disableAction = true;
            // 지연시키는 함수
            setTimeout(() => {
                addFruit();
                disableAction = false;
            }, 1000);
            break;
    }
}

window.onkeyup = (event) => {
    switch(event.code)
    {
        // 인터벌 제어
        case "KeyA":
        case "KeyD":
            clearInterval(interval);
            interval = null;
            break;
    }
}

//충돌 판정
Events.on(engine, "collisionStart", (event) => {



    event.pairs.forEach((collision) => {
        if(collision.bodyA.name !== "topLine" && collision.bodyB.name !== "topLine"){
                        var audio = new Audio("sound/bonus.m4a");
            audio.play();
        }

        // 같은 과일일 경우
        if(collision.bodyA.index == collision.bodyB.index)
        {
            // 지우기 전에 해당 과일 값을 저장
            const index = collision.bodyA.index;

            // 과일 지우기
            World.remove(world, [collision.bodyA, collision.bodyB]);

            // 수박일 경우에 처리하지 않음
            if(index == FRUITS.length - 1) return;

            // 다음 단계 과일 생성
            const newFruit = FRUITS[index+1];
            const newBody = Bodies.circle(
                // 충돌한 지점의 x, y
                collision.collision.supports[0].x,
                collision.collision.supports[0].y,
                newFruit.radius,
                {
                    // 과일값 1 증가
                    index: index+1,
                    render: {
                        sprite: {
                            texture: `${newFruit.name}.png`,
                            xScale: (newFruit.radius * 2) / 2544,
                            yScale: (newFruit.radius * 2) / 2544 }
                    },
                }
            );

            var audio = new Audio(newFruit.sound);
            audio.play();

            // 새로 만든 과일 추가
            World.add(world, newBody);

            // 게임 승리 조건
            if(newBody.index === 10) {
                setTimeout(() => {
                    alert("You made watermelon!\nCongratulation!");
                    disableAction = true;
                }, 1000);
            }
        }

        if(!disableAction && (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")){
            alert("Game Over");
            disableAction = true;
        }
    })
})

// 함수 호출
addFruit();