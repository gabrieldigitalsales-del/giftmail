import http.server, socketserver, os
from pathlib import Path
PORT=8080
os.chdir(Path(__file__).resolve().parent)
class Handler(http.server.SimpleHTTPRequestHandler):
    pass
if __name__=="__main__":
    print(f"GIFT Mail local: http://localhost:{PORT}")
    with socketserver.TCPServer(("127.0.0.1",PORT),Handler) as httpd:
        httpd.serve_forever()
