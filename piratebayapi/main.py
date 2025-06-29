import PirateBayAPI
import typing


# Static Typing isn't required (but recomended)
results: typing.List[PirateBayAPI.SearchElement] = PirateBayAPI.Search(
    "dark souls 2", PirateBayAPI.GamesType.PC)

movie_info = {
    "name": results[0].name,
    "download_link": PirateBayAPI.Download(results[0].id)
}
def getGame(query):
    results: typing.List[PirateBayAPI.SearchElement] = PirateBayAPI.Search(
    query, PirateBayAPI.GamesType.PC)

    game_info = {
        "name": results[0].name,
        "download_link": PirateBayAPI.Download(results[0].id)
    }
    return game_info

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    query = request.args.get('q')
    if query:
        # Process the query here (e.g., reverse it)
        result = getGame(query)

    else:
        result = "No query provided."
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(port=5000)



