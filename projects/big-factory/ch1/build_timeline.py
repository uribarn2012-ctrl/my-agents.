"""Compute ch1/timeline.json from durs.json (narration start of every line) + sound-effect cues."""
import json, os
B = os.path.dirname(os.path.abspath(__file__))
durs = json.load(open(f'{B}/durs.json'))
GAP, LEAD, TAIL = 0.35, 0.7, 1.6
starts, t = [], LEAD
for d in durs:
    starts.append(round(t, 3)); t += d + GAP
end = round(t - GAP + TAIL, 3)
# sfx cues: (beat, offset-from-beat-start, kind). kinds are made in mix_audio.py
CUES = [(0, .3, 'whoosh'), (0, 3.7, 'pop'), (1, 1.0, 'pop'), (2, .3, 'pop'), (3, .1, 'thud'), (4, 1.8, 'thud'), (4, 2.4, 'stamp'),
 (5, 2.5, 'pop'), (6, 3.1, 'slam'), (7, .5, 'slam'), (8, 1.5, 'pop'), (8, 2.4, 'pop'), (8, 3.3, 'pop'), (8, 4.7, 'splash'), (8, 6.3, 'twang'),
 (9, .05, 'slam'), (9, .25, 'pop'), (11, 5.6, 'pop'), (12, .9, 'twang'), (12, 1.8, 'twang'), (12, 2.7, 'twang'), (12, 3.5, 'twang'), (12, 4.2, 'twang'), (12, 5.0, 'twang'),
 (13, 2.0, 'pop'), (14, 4.9, 'stamp'), (15, 2.2, 'pop'), (15, 3.1, 'pop'), (15, 4.0, 'pop'), (16, 1.9, 'slam'), (17, .25, 'boom'), (17, .6, 'boom'), (17, .4, 'slam'),
 (18, 1.7, 'slam'), (19, 2.6, 'twang'), (19, 3.1, 'poof'), (20, 3.3, 'slam'), (21, 1.4, 'pop'), (22, .2, 'slam'), (22, 2.8, 'clunk'), (23, 2.1, 'bonk'),
 (24, .3, 'splash'), (25, 1.3, 'pop'), (25, 3.0, 'thud'), (26, .2, 'poke'), (26, .8, 'poke'), (26, 1.4, 'poke'), (27, .2, 'poke'), (27, .12, 'slam'), (28, 3.0, 'pop'), (28, 3.9, 'pop')]
sfx = [[k, round(starts[b] - .1 + o, 3)] for b, o, k in CUES]
# riding sections (soft hoof beat): (start, end)
hoof = [[0.2, starts[1] - .3], [starts[12], starts[12] + 6.0], [starts[14] , starts[14] + 3.0], [starts[28], starts[28] + 4.5]]
json.dump({'times': {'end': end}, 'starts': starts, 'durs': durs, 'sfx': sfx, 'hoof': hoof}, open(f'{B}/timeline.json', 'w'), indent=1)
print('end', end, 'beats', len(starts))
