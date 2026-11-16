import os
import subprocess
import json
from PIL import Image

base_dir = os.path.dirname(os.path.abspath(__file__))
bpmn_path = os.path.abspath(os.path.join(base_dir, '..', 'civicflow', 'camunda', 'bpmn', 'municipal_building_permit_process.bpmn'))

with open(bpmn_path, 'r', encoding='utf-8') as f:
    xml_content = f.read()

html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body, html {{ margin: 0; padding: 0; width: 3200px; height: 1000px; background: white; overflow: hidden; }}
    #canvas {{ width: 3200px; height: 1000px; }}
    .bjs-powered-by {{ display: none !important; }}
  </style>
  <script src="bpmn-viewer.js"></script>
</head>
<body>
  <div id="canvas"></div>
  <script>
    const xml = {json.dumps(xml_content)};
    const viewer = new BpmnJS({{ container: '#canvas' }});
    viewer.importXML(xml).then(() => {{
      const canvas = viewer.get('canvas');
      canvas.zoom('fit-viewport');
      document.title = 'READY';
    }}).catch(err => {{
      console.error(err);
      document.title = 'ERROR';
    }});
  </script>
</body>
</html>"""

html_path = os.path.join(base_dir, 'render_bpmn_crisp.html')
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
raw_png = os.path.join(base_dir, 'figure2_1_raw.png')
file_url = 'file:///' + html_path.replace('\\', '/')

cmd = [
    chrome,
    '--headless',
    '--disable-gpu',
    '--screenshot=' + raw_png,
    '--window-size=3200,1000',
    '--force-device-scale-factor=2',
    '--hide-scrollbars',
    '--virtual-time-budget=6000',
    file_url
]

subprocess.run(cmd, check=True)

# Autotrim white borders with 30px padding
img = Image.open(raw_png)
# Find non-white bounding box
# We can find bbox by inverting or checking luminance != 255
import numpy as np
arr = np.array(img.convert('RGB'))
non_white = np.where((arr[:, :, 0] < 250) | (arr[:, :, 1] < 250) | (arr[:, :, 2] < 250))
if len(non_white[0]) > 0:
    min_y, max_y = np.min(non_white[0]), np.max(non_white[0])
    min_x, max_x = np.min(non_white[1]), np.max(non_white[1])
    pad = 40
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(img.width, max_x + pad)
    max_y = min(img.height, max_y + pad)
    cropped = img.crop((min_x, min_y, max_x, max_y))
    final_path = os.path.join(base_dir, 'figure2_1_final.png')
    cropped.save(final_path, 'PNG', optimize=True)
    print(f"Saved figure2_1_final.png with size {cropped.size} from raw {img.size}")
else:
    print("Could not find content in image!")
