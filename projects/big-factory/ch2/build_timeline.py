"""Compute ch2/timeline.json from durs.json (narration start of every line) + sound-effect cues."""
import json, os
B = os.path.dirname(os.path.abspath(__file__))
durs = json.load(open(f'{B}/durs.json'))
GAP, LEAD, TAIL = 0.35, 0.7, 1.6
starts, t = [], LEAD
for d in durs:
    starts.append(round(t, 3)); t += d + GAP
end = round(t - GAP + TAIL, 3)
# sfx cues: (beat, offset-from-beat-start, kind). kinds are made in mix_audio.py
CUES = [(0, .3, 'whoosh'), (0, 2.4, 'pop'), (1, .3, 'pop'), (2, .4, 'pop'), (3, .4, 'pop'), (4, .8, 'pop'), (5, .6, 'pop'),
 (6, .2, 'twang'), (6, .5, 'twang'), (6, .8, 'twang'), (6, 1.6, 'pop'), (6, 2.2, 'pop'), (6, 2.6, 'pop'), (8, .3, 'pop'),
 (9, .5, 'pop'), (10, .5, 'stamp'), (10, 2.5, 'pop'), (10, 2.6, 'stamp'), (10, 3.3, 'pop'), (11, 4.5, 'pop'),
 (12, .1, 'pop'), (12, .3, 'whoosh'), (12, .5, 'pop'), (12, .6, 'pop'), (13, 1.3, 'twang'), (13, 2.0, 'thud'), (13, 2.0, 'poof'),
 (14, 2.3, 'pop'), (15, 3.2, 'pop'), (15, 4.4, 'stamp'), (17, .05, 'pop'), (17, .4, 'pop'),
 (18, .2, 'slam'), (19, .3, 'pop'), (20, 3.2, 'slam'), (21, .3, 'pop'), (21, .5, 'pop'), (22, 0, 'clunk'), (22, .2, 'slam'), (23, .0, 'pop'),
 (25, .3, 'pop'), (25, .6, 'pop'), (27, 1.2, 'stamp'), (27, 1.8, 'pop'), (28, 1.4, 'pop'), (28, 3.0, 'bonk'),
 (29, .2, 'slam'), (29, .5, 'pop'), (29, .65, 'pop'), (29, .8, 'pop'), (29, .95, 'pop'), (29, 1.1, 'pop'), (29, 1.25, 'pop'),
 (31, .3, 'whoosh'), (31, .4, 'pop'), (32, .3, 'pop'), (32, .9, 'pop'), (32, 1.4, 'pop'), (33, 1.6, 'pop'), (33, 3.2, 'poof'), (33, 3.7, 'pop'),
 (34, .5, 'pop'), (35, .2, 'pop'), (35, .3, 'pop'), (35, .5, 'pop'), (35, 1.0, 'pop'), (35, 1.73, 'pop'), (35, 2.46, 'pop'), (35, 3.19, 'pop'), (36, .1, 'slam'),
 (37, .4, 'pop'), (37, 3.2, 'pop'), (39, .5, 'pop'), (40, .1, 'slam'), (40, 1.1, 'poof'), (41, .3, 'pop'),
 (42, .3, 'pop'), (42, 1.9, 'pop'), (42, 3.5, 'pop'), (42, 5.1, 'pop'), (42, 5.6, 'stamp'), (42, 7.0, 'pop'),
 (43, .3, 'pop'), (43, .2, 'whoosh'), (44, .3, 'pop'), (44, 1.0, 'pop'), (44, 4.4, 'stamp'),
 (45, .8, 'slam'), (46, .0, 'whoosh'), (46, 1.4, 'twang'), (46, 1.6, 'twang'), (46, 1.8, 'twang'), (46, 2.2, 'pop')]
sfx = [[k, round(starts[b] - .1 + o, 3)] for b, o, k in CUES]
# riding sections (soft hoof beat): (start, end)
hoof = [[starts[1] - .1, starts[2] - .3], [starts[13] - .1, starts[13] + 1.9], [starts[16] - .1, starts[17] - .3],
        [starts[23] + .2, starts[23] + 4.1], [starts[24] - .1, starts[25] - .3]]
json.dump({'times': {'end': end}, 'starts': starts, 'durs': durs, 'sfx': sfx, 'hoof': hoof}, open(f'{B}/timeline.json', 'w'), indent=1)
print('end', end, 'beats', len(starts))
