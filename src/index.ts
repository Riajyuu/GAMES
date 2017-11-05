// Thanks to the hard work of http://winkervsbecks.github.io/a-triangle-everyday/triangle-lost-in-space/
// This file is Typescripted version of the original work
import * as Paper from 'paper'
declare const paper: typeof Paper
declare module 'paper' {
    interface View {
        getSize(): { width: number, height: number }
    }
}

const ScoreBoard = document.querySelector('#score span')
const Progress = document.querySelector('.progress .value') as HTMLDivElement
class Game {
    score: number = 0
    private _health: number = 100
    dead = false
    speedPrefix = 25

    public get health() { return this._health }

    public set health(v) {
        this._health = v
        Progress.parentElement.style.opacity = (this._health > 90 ? 0 : 1) + ''
        Progress.className = 'value ' + (this._health < 40 ? 'danger' : '')
        Progress.style.width = v + '%'
    }

    static godMode = document.getElementById('god')
    godMode = false
    autoHeal = setInterval(() => {
        if (this.health + 0.1 >= 100) { return }
        if (this.godMode) { this.health += 0.3 }
        else { this.health += 0.1 }
    }, 100)
    constructor() {
        this.startGodMode(5000)
    }
    addScore(x: number) {
        this.score = parseInt((this.score + x) * 100 + '') / 100
        ScoreBoard.innerHTML = this.score + ''
    }
    async onDead() {
        this.dead = true
        clearInterval(this.autoHeal)
        document.getElementById('gameover').style.opacity = 1 + ''
        Progress.parentElement.style.opacity = 0 + ''

        let bgm = document.getElementById('bgm') as HTMLAudioElement
        function closeBgm() {
            return new Promise(resolve => {
                let timer = setInterval(() => {
                    if (bgm.volume >= 0.07) {
                        bgm.volume = 0
                        clearInterval(timer)
                        resolve()
                    }
                    bgm.volume -= 0.01
                }, 100)
            })
        }
        await closeBgm()
    }
    hurt(scale: number) {
        if (this.godMode === true) return
        this.health -= 27.5 * scale
        if (this.health < 50) {
            this.speedPrefix -= 5
        }
        if (this.health <= 0) {
            this.onDead()
        } else {
            this.startGodMode()
        }
    }
    private switchOnAnimate() {
        var newone = Game.godMode.cloneNode(true)
        Game.godMode.parentNode.replaceChild(newone, Game.godMode)
        Game.godMode = document.getElementById('god')
    }
    startGodMode(lastFor: number = 2000) {
        if (this.godMode) return
        this.godMode = true
        this.switchOnAnimate()
        setTimeout(() => {
            this.godMode = false
            Game.godMode.style.animationDuration = lastFor + 'ms'
        }, lastFor)
    }
}
const game = new Game
const SQRT_3 = Math.pow(3, 0.5)
let triangle: Triangle, D: number, mousePos: Paper.Point, position: Paper.Point
const count = 5

function init() {
    paper.setup('triangle-lost-in-space')

    D = Math.max(paper.view.getSize().width, paper.view.getSize().height)

    mousePos = paper.view.center.add([paper.view.bounds.width / 3, 100])
    position = paper.view.center

    // Draw the BG
    const background = new paper.Path.Rectangle(paper.view.bounds)
    background.fillColor = '#222222'
    buildStars()
    triangle = new Triangle(50)

    paper.view.draw()

    paper.view.onFrame = function (event) {
        if (game.dead) { return false }
        position = position.add((mousePos.subtract(position).divide(10)))
        const vector = (paper.view.center.subtract(position)).divide(10)
        /** Here we're going to set speed ourself */
        /** Speed = 1.5 * max( (score / 7.5) + prefix, 25 ) */
        moveStars(vector.normalize(
            Math.max(game.score / 7.5 + game.speedPrefix, 25)
        ).multiply(1.5))
        triangle.update()
    }

    Game.godMode.style.marginLeft = (paper.view.size.width - 60) / 2 + 'px'
    Game.godMode.style.marginTop = (paper.view.size.height - 60) / 2 + 'px'
}
window.onload = init


// ---------------------------------------------------
//  Helpers
// ---------------------------------------------------
function setCenter(ele: HTMLElement) {
    const d = document.documentElement
    ele.style.display = 'fixed'
    ele.style.top = (d.scrollTop + (d.clientHeight - ele.offsetHeight) / 2) + 'px'
    ele.style.left = (d.scrollLeft + (d.clientWidth - ele.offsetWidth) / 2) + 'px'
}
setCenter(document.getElementById('gameover'))
setCenter(document.querySelector('.progress') as HTMLElement)
window.onresize = function () {
    paper.project.clear()
    D = Math.max(paper.view.getSize().width, paper.view.getSize().height)
    // Draw the BG
    const background = new paper.Path.Rectangle(paper.view.bounds)
    background.fillColor = '#222222'
    buildStars()
    triangle.build(50)
}

function random(minimum, maximum) {
    return Math.round(Math.random() * (maximum - minimum) + minimum)
}

function map(n, start1, stop1, start2, stop2) {
    return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2
}


// ---------------------------------------------------
//  Triangle
// ---------------------------------------------------
class Triangle {
    public flameSize: number
    public flame: Paper.Path
    public ship: Paper.Path
    public group: Paper.Group
    constructor(a: number) { this.build(a) }
    build(a: number) {
        // The points of the triangle
        const segments = [new paper.Point(0, -a / SQRT_3),
        new paper.Point(-a / 2, a * 0.5 / SQRT_3),
        new paper.Point(a / 2, a * 0.5 / SQRT_3)]

        this.flameSize = a / SQRT_3
        const flameSegments = [new paper.Point(0, this.flameSize),
        new paper.Point(-a / 3, a * 0.4 / SQRT_3),
        new paper.Point(a / 3, a * 0.4 / SQRT_3)]

        this.flame = new paper.Path({
            segments: flameSegments,
            closed: true,
            fillColor: '#e65100'
        })
        this.ship = new paper.Path({
            segments: segments,
            closed: true,
            fillColor: '#90A4AE'
        })
        this.group = new paper.Group({
            children: [this.flame, this.ship],
            position: paper.view.center
        })
    }
    update() {
        this.flame.segments[0].point.x = random(this.flame.segments[1].point.x, this.flame.segments[2].point.x)

        const dist = mousePos.subtract(paper.view.center).length
        const angle = mousePos.subtract(paper.view.center).angle
        const spread = map(dist, 0, D / 2, 10, 30)

        this.flame.segments[0].point = paper.view.center.subtract(new paper.Point({
            length: map(dist, 0, D / 2, 2 * this.flameSize / 3, this.flameSize),
            angle: random(angle - spread, angle + spread)
        }))
    }
    rotate() {
        const angle = paper.view.center.subtract(mousePos).angle - paper.view.center.subtract(this.ship.segments[0].point).angle
        this.group.rotate(angle, paper.view.center)
    }

}

// ---------------------------------------------------
//  Stars
// ---------------------------------------------------
window.onmousemove = function (event) {
    if (!mousePos || game.dead) return
    mousePos.x = event.x
    mousePos.y = event.y
    triangle.rotate()
}

function buildStars() {
    // Create a symbol, which we will use to place instances of later:
    const path = new paper.Path.Circle({
        center: [0, 0],
        radius: 5,
        fillColor: 'white',
        strokeColor: 'white'
    })
    path.name = 'Star'

    const symbol = new paper.Symbol(path)

    // Place the instances of the symbol:
    for (let i = 0; i < count; i++) {
        // The center position is a random point in the view:
        const center = paper.Point.random().multiply(<any>paper.view.size)
        const placed = symbol.place(center)
        // Size of the starts
        placed.scale(3.5)
        // placed.scale(i / count + 0.01)
        placed.data = {
            vector: new paper.Point({
                angle: Math.random() * 360,
                length: (i / count) * Math.random() / 5
            })
        }
    }

    const vector = new paper.Point({
        angle: 45,
        length: 0
    })
}

function keepInView(item) {
    const position = item.position
    const viewBounds = paper.view.bounds
    if (position.isInside(viewBounds))
        return
    const itemBounds = item.bounds
    if (position.x > viewBounds.width + 5) {
        position.x = -item.bounds.width
        position.y = position.y + 20
    }

    if (position.x < -itemBounds.width - 5) {
        position.x = viewBounds.width
        position.y = position.y + 20
    }

    if (position.y > viewBounds.height + 5) {
        position.y = -itemBounds.height
        position.x = position.x + 20
    }

    if (position.y < -itemBounds.height - 5) {
        position.y = viewBounds.height
        position.x = position.x + 20
    }
}

let distance = 0
function moveStars(vector) {
    // Run through the active layer's children list and change
    // the position of the placed symbols:
    const layer = paper.project.activeLayer
    for (let i = 1; i < count + 1; i++) {
        const item = layer.children[i]
        const size = item.bounds.size
        const length = vector.length / 10 * size.width / 10
        /** Only add score for lenght of the first star */
        distance += length
        item.position = item.position.add(vector.normalize(length).add(item.data.vector))
        keepInView(item)

        triangle.group.contains(item.position) && game.hurt(i / count + 0.01)
    }
}
setInterval(() => {
    let d = distance / 5000
    game.addScore(d)
    distance = 0
}, 50)
