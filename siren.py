# stdlib
from os import environ
# 3rd party
from flask import abort, Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
pwd = environ.get('YT_SIREN_PASSWORD', 'changeme')


@app.route('/', methods=['POST'])
def post():
    if request.json['pwd'] != pwd:
        abort(403)

    with open('song.txt', 'w') as f:
        f.write(f'{request.json["song"]} :: {request.json["chapter"]}')

    return ''


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8443)
