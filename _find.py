import re, sys

with open(r'E:\mln_game\game.js', 'r', encoding='utf-8') as f:
    content = f.read()

for pat in ['drawPhase0Terrain', 'drawBackground', 'PHASE 0', 'drawFarmingZones']:
    m = re.search(pat, content)
    if m:
        sys.stdout.buffer.write(f'{m.start()} {pat}\n'.encode('utf-8'))
    else:
        sys.stdout.buffer.write(f'NOT FOUND: {pat}\n'.encode('utf-8'))
