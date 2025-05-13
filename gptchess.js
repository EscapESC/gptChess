let moveSound = new Audio("sounds/move-self.mp3");
let captureSound = new Audio("sounds/capture.mp3");

class board {

    constructor(color) {

        this.gameID;

        this.turn = "w";

        this.pieces = [];

        this.pColor = color;

        startNewGame(color);

        populate(this);

        document.getElementById("board").addEventListener("mousedown", function(event) { // Mouse down event.
                let pos = getPos(event);
                for(let i = 0; i < chessBoard.pieces.length; i++){
                    if(chessBoard.pieces[i].x == pos[0] && chessBoard.pieces[i].y == pos[1] && chessBoard.pieces[i].color == chessBoard.pColor && chessBoard.turn == chessBoard.pColor){
                        if(chessBoard.selected != null){chessBoard.selected.object.classList.remove("selected")}
                        chessBoard.selected = chessBoard.pieces[i]
                        chessBoard.pieces[i].object.classList.add("selected");
                    }
                }
        })

        document.getElementById("board").addEventListener("mouseup", function(event) { // Mouse up event.
                let pos = getPos(event);

                let clear = true;

                for(let i = 0; i < chessBoard.pieces.length; i++){
                    if(chessBoard.pieces[i].x == pos[0] && chessBoard.pieces[i].y == pos[1]){
                        clear = false;
                        break;
                    }
                }

                if (chessBoard.selected != null){
                    if((chessBoard.selected.x != pos[0] || chessBoard.selected.y != pos[1]) && pieceColorAt(pos[0], pos[1]) != chessBoard.pColor){
                        chessBoard.selected.movePiece(pos[0], pos[1]);
                        chessBoard.selected.object.classList.remove("selected");
                        chessBoard.selected = null;
                    }
                } 

        })
    }


    addPiece(type, color, posX, posY) {

        this.pieces.push(new piece(type,color,posX,posY))

    }

}


class piece {

    constructor(type, color, posX, posY) {

        this.x = posX;

        this.y = posY;

        this.type = type.toLowerCase();

        this.color = color.toLowerCase();

        this.object = document.createElement("div");

        this.object.classList.add("piece");

        this.object.style.left = (this.x - 1) * 11.25 + "vh";

        this.object.style.top = (8-this.y) * 11.25 + "vh";

        this.hasMoved = false;


        const validTypes = ["pawn", "rook", "knight", "bishop", "queen", "king"];

        if (validTypes.includes(this.type)) {

            this.object.style.backgroundImage = `url("images/pieces/${this.type}_${this.color}.png")`;

            document.getElementById("board").append(this.object);

        } else {

            console.error(`Invalid piece type: ${this.type}`);

        }

    }


    movePiece(posX, posY){
        console.log(this.type+" from "+this.x+this.y+" to "+posX+posY);
        
        if(this.color == chessBoard.pColor && chessBoard.turn == chessBoard.pColor){
            sendMoveUpdate(this.x, this.y,posX, posY);
        }
        
        let caturePiece = pieceAt(posX, posY);

        this.x = posX;
        this.y = posY;

        this.object.style.left = (this.x-1) * 11.25 + "vh";

        this.object.style.top = (8-this.y) * 11.25 + "vh";

        if (chessBoard.turn == "w") {
            chessBoard.turn = "b";
        } else {
            chessBoard.turn = "w";
        }

        if(caturePiece != null && caturePiece != this){
            if (caturePiece.type == "king") {
                if(caturePiece.color == "w"){
                    console.log("BLACK HAS WON");
                    document.getElementById("wintext").innerText = "BLACK HAS WON";
                    document.getElementById("wintext").style.color = "black";
                }
                else{
                    console.log("WHITE HAS WON");
                    document.getElementById("wintext").innerText = "WHITE HAS WON";
                    document.getElementById("wintext").style.color = "white";
                }
                document.getElementById("win").style.visibility = "visible";
                document.getElementById("win").style.top = "50%";
            }
            caturePiece.die()
            captureSound.play()
        }
        else{
            moveSound.play();
        }

        this.hasMoved = true;
    }

    die(){
        for(let i = 0; i < chessBoard.pieces.length; i++){
            if(chessBoard.pieces[i] == this){
                chessBoard.pieces.splice(i,1);
                this.object.remove();
                break;
            }
        }
    }

}

async function startNewGame(color) {
    try {
        const response = await fetch('http://127.0.0.1:5000/chess/api/newgame',{method: 'POST',headers: {'Content-Type': 'application/json',},body: JSON.stringify({color:color}),});
        if (response.ok) {
            const data = await response.json();
            console.log(data);
            chessBoard.gameID = data.gameid;
            if(color == "b"){
                pieceAt(data.move.from[0], data.move.from[1]).movePiece(data.move.to[0],data.move.to[1]);
                console.log(data.move.com)
                document.getElementById('chat').innerHTML += "<br><br>"+data.move.com;
            }
        } else {
            throw new Error('Failed to fetch data');
        }
    } catch (error) {
        console.error('Error:', error); 
    }
}

async function sendMoveUpdate(orX, orY, newX, newY){
    try {
        const response = await fetch('http://127.0.0.1:5000/chess/api/move',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({gameid : chessBoard.gameID,from : {orX:numtoa(orX), orY}, to : {newX:numtoa(newX), newY}}),
        });
        if (response.ok) {
            const data = await response.json();
            let tempPiece = pieceAt(data.move.from[0], data.move.from[1])
            console.log(data.move.com)
            document.getElementById('chat').innerHTML += "<br>"+data.move.com;
            if(tempPiece != null){
                tempPiece.movePiece(data.move.to[0],data.move.to[1]);
            }
            else{
                if (chessBoard.turn == "w") {
                    chessBoard.turn = "b";
                } else {
                    chessBoard.turn = "w";
                }
                console.log("ChatGPT tried making a move with an nonexistant piece")
            }
        } else {
            throw new Error('Failed to fetch data');
        }
    } catch (error) {
        console.error('Error:', error); 
    }
}


function populate(boardInstance) {

    const b = 'b';

    const w = 'w';


    // Pawns

    for (let x = 1; x <= 8; x++) {

        boardInstance.addPiece('pawn', b, x, 7);

        boardInstance.addPiece('pawn', w, x, 2);

    }


    // Rooks

    boardInstance.addPiece('rook', b, 1, 8);

    boardInstance.addPiece('rook', b, 8, 8);

    boardInstance.addPiece('rook', w, 1, 1);

    boardInstance.addPiece('rook', w, 8, 1);


    // Knights

    boardInstance.addPiece('knight', b, 2, 8);

    boardInstance.addPiece('knight', b, 7, 8);

    boardInstance.addPiece('knight', w, 2, 1);

    boardInstance.addPiece('knight', w, 7, 1);


    // Bishops

    boardInstance.addPiece('bishop', b, 3, 8);

    boardInstance.addPiece('bishop', b, 6, 8);

    boardInstance.addPiece('bishop', w, 3, 1);

    boardInstance.addPiece('bishop', w, 6, 1);


    // Queens

    boardInstance.addPiece('queen', b, 4, 8);

    boardInstance.addPiece('queen', w, 4, 1);


    // Kings

    boardInstance.addPiece('king', b, 5, 8);

    boardInstance.addPiece('king', w, 5, 1);

}

function getPos(event) {
    const board = event.currentTarget;
    const rect = board.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const boardSize = rect.width;
    const squareSize = boardSize / 8;

    const file = Math.floor(x / squareSize) + 1;
    const rank = 8 - Math.floor(y / squareSize);

    return [file,rank];
}

function pieceAt(posX,posY){
    for(let i = 0; i < chessBoard.pieces.length; i++){
        if(chessBoard.pieces[i].x == posX && chessBoard.pieces[i].y == posY){
            return chessBoard.pieces[i];
        }
    }
    return null;
}

function pieceColorAt(posX,posY){
    for(let i = 0; i < chessBoard.pieces.length; i++){
        if(chessBoard.pieces[i].x == posX && chessBoard.pieces[i].y == posY){
            return chessBoard.pieces[i].color;
        }
    }
    return "none";
}

function numtoa(num){
    alphabet = ["0","a","b","c","d","e","f","g","h"];
    return alphabet[num];
}

function charToInt(c) {
    if (!/^[a-zA-Z]$/.test(c)) return null;
    return c.toLowerCase().charCodeAt(0) - 96;
}

chessBoard = new board('w')