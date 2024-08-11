/*
This is a javascript version of linear space myers algorithm
Reference: https://blog.jcoglan.com/2017/03/22/myers-diff-in-linear-space-theory/
*/

class Box {
    constructor(left, top, right, bottom) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    get width() {
        return this.right - this.left;
    }

    get height() {
        return this.bottom - this.top;
    }

    get size() {
        return this.width + this.height;
    }

    get delta() {
        return this.width - this.height;
    }
}

/* scan from left-top corner to right-bottom corner in the box */
function forward(box, d, v, vb, a, b) {
    /* from d to -d */
    for(let k = d; k >= -d; k-=2){
        
        /* 
        * (k === -d) means if k is negative, it only can move downward
        * (k !== d) means if k is equal to d, it should move rightward because right has higher priority
        * (k !== d && v[k+1] > v[k-1]) means if k+1 diagonal's x is higher than k-1 diagonal's x 
        * it should move downward
        */
        const isDown = (k === -d) || (k !== d && v[k+1] > v[k-1]);
        
        /* calculate the previous coordinate 
        * k = x - y 
        * however, this is just a split box, so we should find the relative x first
        * relative x = x - box.left
        * relative y = relative x - k
        * actual y = relative y + box.top
        */
        let kPrev = isDown? k+1: k-1;
        let xPrev = v[kPrev];
        let yPrev = (xPrev - box.left) - kPrev + box.top;

        /* calculate the current coordinate */
        let x = isDown? xPrev: xPrev+1;
        let y = (x - box.left) - k + box.top;
        
        /* calculate the next coordinate */
        let xEnd = x;
        let yEnd = y;

        /* if the char a is equal to b, it should move right-bottom direction */
        while(xEnd < box.right && yEnd < box.bottom && a[xEnd] === b[yEnd]){
            xEnd++;
            yEnd++;
        }

        v[k] = xEnd;

        /* formula: c = k - delta */
        let c = k - box.delta;
        
        /*
        * (box.delta%2 !== 0) means forward path will intersect the backward path at odd step
        * (c >= -(d-1) && c <= (d-1)) ensures c is scanned in the backward path 
        * why use (d-1)? because d is behind the forward path by 1 step
        * (yEnd >= vb[c]) means if y is larger than y in the backward path, it means two path are intersected
        */
        if(box.delta%2 !== 0 && (c >= -(d-1) && c <= (d-1)) && yEnd >= vb[c]){
            return {
                xStart: xPrev, yStart: yPrev,  
                xEnd: xEnd, yEnd: yEnd
            };
        }

    }
}

/* 
* Scan from right-bottom corner to left-top corner in the box 
* reverse logic of the forward path
*/
function backward(box, d, v, vb, a, b) {
    for(let c = d; c >= -d; c-=2){
        
        const isLeft = (c === -d) || (c !== d && vb[c+1] < vb[c-1]);
        let k = c + box.delta;
        
        let cPrev = isLeft? c+1: c-1;
        let yPrev = vb[cPrev];

        let y = isLeft? vb[cPrev]: vb[cPrev]-1;
        let x = (y - box.top) + k + box.left;
        let xPrev;
        if (d === 0 || y !== yPrev) {
            xPrev = x;
        } else {
            xPrev = x + 1;
        }

        let yEnd = y;
        let xEnd = x;

        while(xEnd > box.left && yEnd > box.top && a[xEnd-1] === b[yEnd-1]){
            xEnd--;
            yEnd--;
        }

        vb[c] = yEnd;
        
        if(box.delta%2 === 0 && (k >= -d && k <= d) && xEnd <= v[k]){
            return {
                xEnd: xPrev, yEnd: yPrev,  
                xStart: xEnd, yStart: yEnd
            };
        }

    }
}

/* find the mid point of the box, namely mid snake */
function findMid(box, a, b){
    if(box.size === 0){
        return;
    }
    /* 
    * v is the map of each k diagonal 
    * key is k
    * value is the max x on the k diagonal
    */
    let v = {
        1: box.left
    };
    /*
    * vb is the map of each c diagonal 
    * key is c
    * value is the max y on the c diagonal
    */
    let vb = {
        1: box.bottom
    };
    let max = Math.ceil(box.size/2);

    for(let d = 0; d <= max; d++){
        let forwardSnake = forward(box, d, v, vb, a, b);
        let backwardSnake = backward(box, d, v, vb, a, b);
        let snake = forwardSnake || backwardSnake;
        /* if snake exists, it means there is a mid point */
        if(snake){
            return snake;
        }
    }

}

function findPath(box, a, b){
    let midSnake = findMid(box, a, b);
    if(midSnake === undefined){
        return;
    }

    /* divide box into two boxs */
    /* calculate the left box */
    let leftBox = new Box(
        box.left, 
        box.top, 
        midSnake.xStart, 
        midSnake.yStart,
    );
    /* calculate the right box */
    let rightBox = new Box(
        midSnake.xEnd,
        midSnake.yEnd,
        box.right,
        box.bottom
    );

    let leftSnakes = findPath(leftBox, a, b) ;
    let rightSnakes = findPath(rightBox, a, b);
    
    /* concatenate left snake and mid snake and right snake */
    let snakes = [midSnake];
    if(leftSnakes !== undefined){
        snakes = leftSnakes.concat(snakes);
    }
    if(rightSnakes !== undefined){
        snakes = snakes.concat(rightSnakes);
    }
    return snakes;
}

function showDiff(snakes, a, b){
    for(let i = 0; i < snakes.length; i++){
        let snake = snakes[i];

        let aIndex = snake.xStart;
        let bIndex = snake.yStart;
        /*
        * snake move left-down 
        * remain charater 
        */
        if(snake.xEnd - snake.xStart > 0 && snake.yEnd - snake.yStart > 0){
            for(let j = snake.xStart; j < snake.xEnd; j++){
                console.log('No change ' + a[j]);
            }
        /* 
        * snake move rightward
        * delete charater 
        */
        } else if(snake.xEnd - snake.xStart > 0){
            console.log('Delete ' + a[aIndex]);
        /*
        * snake move downward 
        * add charater 
        */
        } else if (snake.yEnd - snake.yStart > 0){
            console.log('Add ' + b[bIndex]);
        }
    }
}

function linearMyers(a, b){
    let box = new Box(
        0, 
        0, 
        a.length, 
        b.length
    );
    let snakes = findPath(box, a, b);
    showDiff(snakes, a, b);
}

linearMyers('abc', 'aec');

/*
result:
No change a
Delete b
Add e
No change c
*/
