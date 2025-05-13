let moveSound = new Audio("sounds/move-self.mp3");
let captureSound = new Audio("sounds/capture.mp3");

class board {

    constructor() {

        this.gameID;

        this.turn = "w";

        this.pieces = [];

        this.pColor = "w";

        startNewGame();

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

        this.x = posX;

        this.y = posY;


        this.object.style.left = (this.x-1) * 11.25 + "vh";

        this.object.style.top = (8-this.y) * 11.25 + "vh";

        if (chessBoard.turn == "w") {
            chessBoard.turn = "b";
        } else {
            chessBoard.turn = "w";
        }
        
        moveSound.play();

        this.hasMoved = true;
    }

}

async function startNewGame() {
    try {
        const response = await fetch('127.0.0.1/chess/api');
        if (response.ok) {
            const data = await response.json();
            console.log(data);
            chessBoard.gameID = data;
        } else {
            throw new Error('Failed to fetch data');
        }
    } catch (error) {
        console.error('Error:', error); 
    }
}


function populate(boardInstance) {

    const b = 'b'; //yes 

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

chessBoard = new board()