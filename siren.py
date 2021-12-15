# stdlib
from os import environ
import re
# 3rd party
from flask import abort, Flask, request
from flask_cors import CORS

MAX_LENGTH = 100

app = Flask(__name__)
CORS(app)
pwd = environ.get('YT_SIREN_PASSWORD', 'changeme')

@app.route('/', methods=['POST'])
def post():
    if request.json['pwd'] != pwd:
        abort(403)

    channel = re.sub(' - Topic$', '', request.json['channel'])
    output = f"{channel} - {request.json['song']}"

    if request.json['chapter']:
        output += f" - {request.json['chapter']}"

    if len(output) > MAX_LENGTH:
        output = f'...{output[-MAX_LENGTH:]}'
        
    output += '♫ '

    with open('song.txt', 'w') as f:
        f.write(output)

    with open('url.txt', 'w') as f:
        f.write(f"{channel} - {request.json['song']} {request.json['url']}")

    return ''


if __name__ == '__main__':
    host = environ.get('YT_SIREN_HOST', '127.0.0.1')
    port = environ.get('YT_SIREN_PORT', 8008)
    app.run(host=host, port=port)
