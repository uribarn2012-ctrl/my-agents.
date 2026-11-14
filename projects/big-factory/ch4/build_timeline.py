"""Compute ch3/timeline.json from durs.json (narration start of every line) + sound-effect cues."""
import json, os
B = os.path.dirname(os.path.abspath(__file__))
durs = json.load(open(f'{B}/durs.json'))
GAP, LEAD, TAIL = 0.85, 0.9, 2.0
starts, t = [], LEAD
for d in durs:
    starts.append(round(t, 3)); t += d + GAP
end = round(t - GAP + TAIL, 3)
# sfx cues: (beat, offset-from-beat-start, kind). kinds are made in mix_audio.py
CUES = [(0,.3,'pop'),(0,1.0,'pop'),(1,.8,'whoosh'),(1,1.4,'pop'),(2,.8,'whoosh'),(2,1.5,'pop'),(2,3.4,'clunk'),(2,3.8,'clunk'),
 (3,.3,'pop'),(3,1.5,'thud'),(3,1.9,'pop'),(4,.2,'slam'),(4,.5,'whoosh'),
 (5,.4,'whoosh'),(5,2.7,'pop'),(5,4.5,'slam'),(5,4.6,'pop'),(6,.3,'pop'),(6,3.8,'pop'),(6,4.3,'pop'),
 (7,1.4,'pop'),(7,2.0,'pop'),(8,.8,'pop'),(8,1.5,'pop'),(8,2.2,'pop'),(9,.4,'pop'),(9,2.1,'pop'),(10,.5,'poof'),(10,.7,'pop'),(10,1.0,'slam'),
 (11,.15,'pop'),(11,.45,'pop'),(11,.9,'slam'),(11,1.1,'pop'),
 (12,.3,'pop'),(12,.6,'pop'),(12,1.1,'pop'),(13,.3,'whoosh'),(13,.4,'pop'),(14,.4,'pop'),(14,1.2,'pop'),(14,2.0,'pop'),(15,.1,'slam'),(15,.3,'whoosh'),(16,.2,'whoosh'),(16,.7,'slam'),
 (17,.3,'pop'),(17,1.8,'stamp'),(17,2.4,'pop'),(18,.2,'pop'),(18,1.2,'clunk'),(18,2.4,'clunk'),(18,3.2,'clunk'),(18,4.4,'thud'),
 (20,.3,'whoosh'),(20,1.5,'pop'),(20,2.5,'pop'),(20,3.9,'pop'),(21,.4,'pop'),(21,1.0,'whoosh'),(22,.3,'pop'),(22,1.0,'pop'),(22,1.9,'pop'),(22,2.6,'pop'),(22,3.4,'pop'),(23,.1,'slam'),(23,.5,'slam'),
 (24,.2,'pop'),(24,.5,'whoosh'),(24,1.0,'pop'),(24,1.2,'pop'),(25,.4,'pop'),(25,1.25,'pop'),(25,2.1,'pop'),(25,.8,'pop'),(25,1.65,'pop'),(25,2.5,'pop'),(26,1.0,'pop'),(26,2.0,'pop'),
 (27,.2,'whoosh'),(27,.6,'slam'),(28,.1,'pop'),(28,.4,'whoosh'),(28,1.5,'pop'),(28,2.4,'pop')]
sfx = [[k, round(starts[b] - .1 + o, 3)] for b, o, k in CUES]
# riding sections (soft hoof beat): (start, end)
hoof = [[starts[3] - .1, starts[3] + 2.3], [starts[3] + 2.5, starts[3] + 4.0], [starts[5], starts[5] + 8], [starts[7] - .1, starts[7] + 2.6], [starts[20], starts[20] + 2.4], [starts[20] + .3, starts[20] + 4.4]]
json.dump({'times': {'end': end}, 'starts': starts, 'durs': durs, 'sfx': sfx, 'hoof': hoof}, open(f'{B}/timeline.json', 'w'), indent=1)
print('end', end, 'beats', len(starts))
