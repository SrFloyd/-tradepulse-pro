#!/usr/bin/env python3
"""TradePulse Pro local static server + Binance read-only account endpoint.
Only GET endpoints are exposed. No order placement, cancellation, withdrawal, or trading routes.
API credentials are read only from process environment and never written to disk or logged.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import os, time, hmac, hashlib, json

ROOT = Path(__file__).resolve().parent
HOST = '127.0.0.1'
PORT = int(os.environ.get('TRADEPULSE_PORT', '8765'))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        # Do not log headers, query strings, API keys, or account payloads.
        print('%s - %s' % (self.address_string(), fmt % args))

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/health':
            ready = bool(os.environ.get('BINANCE_API_KEY') and os.environ.get('BINANCE_API_SECRET'))
            return self.send_json(200, {'ok': True, 'accountConfigured': ready, 'exchange': 'Binance', 'mode': 'read-only endpoint'})
        if path == '/api/account':
            key = os.environ.get('BINANCE_API_KEY', '').strip()
            secret = os.environ.get('BINANCE_API_SECRET', '').strip()
            if not key or not secret:
                return self.send_json(400, {'ok': False, 'error': 'Credenciais não configuradas no ambiente do servidor.'})
            params = urlencode({'timestamp': int(time.time() * 1000), 'recvWindow': 5000})
            signature = hmac.new(secret.encode('utf-8'), params.encode('utf-8'), hashlib.sha256).hexdigest()
            url = 'https://api.binance.com/api/v3/account?' + params + '&signature=' + signature
            req = Request(url, headers={'X-MBX-APIKEY': key, 'Accept': 'application/json'}, method='GET')
            try:
                with urlopen(req, timeout=12) as response:
                    payload = json.loads(response.read().decode('utf-8'))
                balances = []
                for item in payload.get('balances', []):
                    free = float(item.get('free') or 0)
                    locked = float(item.get('locked') or 0)
                    if free or locked:
                        balances.append({'asset': item.get('asset', ''), 'free': free, 'locked': locked, 'total': free + locked})
                balances.sort(key=lambda item: item['total'], reverse=True)
                return self.send_json(200, {'ok': True, 'exchange': 'Binance', 'accountType': payload.get('accountType', '—'), 'permissions': payload.get('permissions', []), 'balances': balances[:100], 'readAt': int(time.time() * 1000)})
            except HTTPError as e:
                # Do not forward exchange response body, which can contain details not needed by the UI.
                return self.send_json(502, {'ok': False, 'error': 'A Binance recusou a consulta. Verifique as permissões de leitura, a chave e o relógio do dispositivo.' if e.code in (401, 403) else 'Falha ao consultar a conta na Binance.'})
            except (URLError, TimeoutError, ValueError, OSError):
                return self.send_json(502, {'ok': False, 'error': 'Não foi possível consultar a Binance. Verifique a conexão.'})
        if path.startswith('/api/'):
            return self.send_json(404, {'ok': False, 'error': 'Endpoint não encontrado.'})
        return super().do_GET()

    def do_POST(self):
        return self.send_json(405, {'ok': False, 'error': 'Método não permitido. Este servidor não envia ordens.'})
    def do_PUT(self):
        return self.send_json(405, {'ok': False, 'error': 'Método não permitido.'})
    def do_DELETE(self):
        return self.send_json(405, {'ok': False, 'error': 'Método não permitido.'})

if __name__ == '__main__':
    print(f'TradePulse Pro disponível em http://{HOST}:{PORT}/index.html')
    print('Backend vinculado somente a localhost. Configure BINANCE_API_KEY e BINANCE_API_SECRET no ambiente para habilitar a consulta de saldo (somente GET).')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
