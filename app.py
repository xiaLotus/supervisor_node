from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# 資料要存放的地方
SAVE_FOLDER = './saved_data'
os.makedirs(SAVE_FOLDER, exist_ok=True)



@app.route('/load_json', methods=['GET'])
def load_json():
    try:
        filepath = os.path.join(SAVE_FOLDER, '節點資料.json')
        if not os.path.exists(filepath):
            return jsonify({'status': 'fail', 'message': 'No saved data found.'}), 404

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        print('Load error:', e)
        return jsonify({'status': 'fail', 'message': str(e)}), 500



@app.route('/save_json', methods=['POST'])
def save_json():
    data = request.get_json()

    if data is None:
        return jsonify({'status': 'fail', 'message': 'No data received'}), 400

    try:
        filepath = os.path.join(SAVE_FOLDER, '節點資料.json')
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return jsonify({'status': 'success', 'message': 'Data saved successfully!'})
    except Exception as e:
        print('Save error:', e)
        return jsonify({'status': 'fail', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
