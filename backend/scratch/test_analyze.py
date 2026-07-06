import io
import json
import urllib.request
from PIL import Image

img = Image.new('RGB', (200, 200), color='red')
buf = io.BytesIO()
img.save(buf, format='JPEG')
image_bytes = buf.getvalue()

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="test_pothole.jpg"\r\n'
    f'Content-Type: image/jpeg\r\n\r\n'
).encode('utf-8') + image_bytes + f'\r\n--{boundary}--\r\n'.encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8000/api/vision/analyze',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
    method='POST',
)

try:
    with urllib.request.urlopen(req) as res:
        print('VISION_ANALYZE_STATUS:', res.status)
        print(res.read().decode('utf-8'))
except Exception as e:
    print('VISION_ANALYZE_ERROR:', str(e))
