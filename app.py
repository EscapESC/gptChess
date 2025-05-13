import openai
from flask import Flask, jsonify, request
import secrets
import time
import threading

key = open("../key.txt", "r").readlines()

app = Flask(__name__)
games = {}

def aliveCheck():
    while True:
        timeNow = time.time()
        for game_id, g in list(games.items()):
            if timeNow - g.lastUpdate > 15:
                print("Killing game", g.gameID)
                g.close()
                games.pop(game_id, None)
        time.sleep(6)

def generate_game_token(length=16):
    return secrets.token_urlsafe(length)

class game:
    gameID: int
    color: bool = True # True - "White" , False - "Black"
    turn: bool = True
    lastUpdate: float
    pieces:list = []

    def __init__(self):
        self.gameID = generate_game_token()
        games[self.gameID] = self
        self.lastUpdate = time.time()

    openaiConvID = None

    def close(self):
        pass

@app.route("/chess/api/newgame", methods=['GET'])
def get():
    tempGame = game()
    return jsonify({"gameid":tempGame.gameID})

aliveChecker = threading.Thread(target=aliveCheck, daemon=True)
aliveChecker.start()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)