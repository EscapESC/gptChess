from openai import OpenAI
from flask import Flask, jsonify, request
from flask_cors import CORS #DELETE ME
import secrets
import time
import json
import threading
import random

promptFormat = ' | Instead of alphabet use numbers 1-8. Write nothing but the format FORMAT {"piece":"PIECETYPE" , "from":[x,y], "to":[x,y],"capture":"CAPTUREDPIECETYPE","com":FUNCOMMENTONYOURTURN}'

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

personalities = ["","French steriotype","Czech steriotype","Pirate steriotype","Personality: Napoleon Bonaparte storiotype (can never be wrong)","Personality:Steven he from youtube","","can only speak in ads slogans","","","memes","tf2 soldier","","Personality: Donald Trump"]

@app.route("/chess/api/newgame", methods=['POST'])
def newGame():
    data = request.get_json(silent=True) or {}

    aiInput = ""

    tempGame = game()

    tempGame.color = data.get('color')
    if tempGame.color not in ('w', 'b'):
        tempGame.color = "w"

    if tempGame.color == 'b':
        aiInput = 'You are now playing chess as white, play your first move. Instead of alphabet use numbers 1-8. Write nothing but the format FORMAT {"piece":PIECETYPE , "from":[x,y], "to":[x,y],"capture":True/False,"com":FUNCOMMENTONYOURTURN'
        tempGame.chatHistory += 'You are playing chess as white.'+personalities[random.randrange(0,len(personalities))]+' Instead of alphabet use numbers 1-8. Tripple check your moves. Game History: '
    else:
        aiInput = 'You are now playing chess as black, for now, wait for moves. Instead of alphabet use numbers 1-8. Write nothing but the format FORMAT {"piece":PIECETYPE , "from":[x,y], "to":[x,y],"capture":True/False,"com":FUNCOMMENTONYOURTURN'
        tempGame.chatHistory += 'You are playing chess as black.'+personalities[random.randrange(0,len(personalities))]+' Instead of alphabet use numbers 1-8.c Tripple check your moves. Game History: ' 

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
    piece = data.get('piece')
    capture = data.get('cap')
    if not orgPos or not newPos or not piece or not capture:
        return jsonify({"error": "Json error"}), 404

    print(game_instance.chatHistory)
    game_instance.chatHistory += " | "+'"{"piece":'+piece+' "from:"['+str(orgPos['orX'])+","+str(orgPos['orY'])+'], "to":['+str(newPos['newX'])+","+str(newPos['newY'])+'], "cap":'+str(capture)+'}'
    
    while True:
        response = client.responses.create(model="gpt-4.1",input=game_instance.chatHistory+promptFormat)
        AllGood = True
        try:
            json.loads(response.output_text)
        except:
            AllGood = False
            print("ERROR "+response.output_text)
        if AllGood:
            break

    print(response.output_text)
    game_instance.chatHistory += " | "+response.output_text
    return jsonify({'move':json.loads(response.output_text)})

aliveChecker = threading.Thread(target=aliveCheck, daemon=True)
aliveChecker.start()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)