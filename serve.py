import http.server
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

server_address = ('0.0.0.0', 3000)
httpd = http.server.HTTPServer(server_address, NoCacheHandler)

print(f"\n========================================")
print(f"  Satoshi's Dream running!")
print(f"  http://localhost:3000/")
print(f"========================================\n")

httpd.serve_forever()
