from openai import OpenAI
from flask import Flask, jsonify, request
from flask_cors import CORS #DELETE ME
import secrets
import time
import json
import threading

promptFormat = ' | Write nothing but the format FORMAT {"piece":PieceType,"from":[x,y], "to":[x,y],"com":FunCommentOnYourMove}'

key = open("../key.txt", "r").read()

client = OpenAI(api_key=key)

app = Flask(__name__)
CORS(app) #DELETE ME
games = {}

def aliveCheck():
    while True:
        timeNow = time.time()
        for game_id, g in list(games.items()):
            if timeNow - g.lastUpdate > 600:
                print("Killing game", g.gameID)
                g.close()
                games.pop(game_id, None)
        time.sleep(60)

def generate_game_token(length=16):
    return secrets.token_urlsafe(length)

class game:
    gameID: int
    color: bool = True # True - "White" , False - "Black"
    turn: bool = True
    lastUpdate: float
    chatHistory: str = ""
    pieces:list = []

    def __init__(self):
        self.gameID = generate_game_token()
        games[self.gameID] = self
        self.lastUpdate = time.time()

    openaiConvID = None

    def close(self):
        pass

@app.route("/chess/api/newgame", methods=['POST'])
def newGame():
    data = request.get_json(silent=True) or {}

    aiInput = ""

    tempGame = game()

    tempGame.color = data.get('color')
    if tempGame.color not in ('w', 'b'):
        tempGame.color = "w"

    if tempGame.color == 'b':
        aiInput = 'You are now playing chess as white, play your first move. Instead of alphabet use 1-8. Write nothing but the format FORMAT {"from":[x,y], "to":[x,y]}'
        tempGame.chatHistory += 'You are playing chess as white. Instead of alphabet use 1-8. Tripple check your moves. Game History: '
    else:
        aiInput = 'You are now playing chess as black, for now, wait for moves. Instead of alphabet use 1-8. Write nothing but the format FORMAT {"from":[x,y], "to":[x,y]}'
        tempGame.chatHistory += 'You are playing chess as black. Instead of alphabet use 1-8.c Tripple check your moves. Game History: ' 

    if tempGame.color == 'w':
        return jsonify({"gameid":tempGame.gameID})
    if tempGame.color == 'b':
        response = client.responses.create(model="gpt-4.1",input=aiInput)
        print(response.output_text)
        tempGame.chatHistory += " | "+response.output_text
        return jsonify({"gameid":tempGame.gameID, 'move':json.loads(response.output_text)})

@app.route("/chess/api/move", methods=['POST'])
def playMove():
    data = request.get_json()
    gameid = data.get('gameid')
    if not gameid:
        return jsonify({"error": "Missing game ID"}), 400

    game_instance: game = games.get(gameid)
    if not game_instance:
        return jsonify({"error": "Game not found"}), 404
    
    game_instance.lastUpdate = time.time()
    
    orgPos = data.get('from', {})
    newPos = data.get('to', {})
    if not orgPos or not newPos:
        return jsonify({"error": "Json error"}), 404

    print(game_instance.chatHistory)
    game_instance.chatHistory += " | "+'"{from:"['+str(orgPos['orX'])+","+str(orgPos['orY'])+'], "to":['+str(newPos['newX'])+","+str(newPos['newY'])+']}'
    
    while True:
        response = client.responses.create(model="gpt-4.1",input=game_instance.chatHistory+promptFormat)
        AllGood = True
        try:
            json.loads(response.output_text)
        except:
            AllGood = False
        if AllGood:
            break

    print(response.output_text)
    game_instance.chatHistory += " | "+response.output_text
    return jsonify({'move':json.loads(response.output_text)})

aliveChecker = threading.Thread(target=aliveCheck, daemon=True)
aliveChecker.start()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)