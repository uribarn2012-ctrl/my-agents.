"""Compute timeline.json from durs.json (narration start of every line) + sound-effect cues."""
import json, os
B = os.path.dirname(os.path.abspath(__file__))
durs = json.load(open(f'{B}/durs.json'))
GAP, LEAD, TAIL = 0.85, 0.9, 6.0
starts, t = [], LEAD
for d in durs:
    starts.append(round(t, 3)); t += d + GAP
end = round(t - GAP + TAIL, 3)
# sfx cues: (beat, offset-from-beat-start, kind). kinds are made in mix_audio.py
CUES = [(0,.3,'pop'),(0,1.8,'poof'),(0,2.6,'thud'),(1,.4,'pop'),(1,1.6,'clunk'),(1,2.4,'clunk'),(1,3.2,'clunk'),(2,.3,'pop'),(2,.9,'pop'),(2,1.7,'clunk'),(2,2.5,'clunk'),(2,3.3,'poof'),(2,4.3,'pop'),
 (3,.3,'twang'),(3,1.2,'pop'),(3,2.4,'pop'),(3,3.2,'whoosh'),(4,.4,'thud'),(4,.6,'whoosh'),(4,2.6,'pop'),(4,5.0,'pop'),(4,7.1,'pop'),(4,9.3,'pop'),
 (5,.4,'pop'),(5,1.2,'pop'),(5,2.2,'pop'),(5,3.4,'pop'),(5,5.0,'pop'),(5,6.2,'whoosh'),
 (6,.2,'whoosh'),(7,.4,'whoosh'),(7,2.6,'slam'),(7,3.4,'pop'),(8,.2,'poof'),(8,.8,'poof'),(8,1.4,'poof'),(9,1.5,'whoosh'),(9,4.0,'pop'),(9,8.4,'poof'),
 (10,.2,'slam'),(10,.4,'pop'),(11,.4,'pop'),(11,1.4,'whoosh'),(11,5.4,'slam'),(12,.4,'pop'),(12,1.4,'pop'),(12,2.4,'pop'),(13,.3,'pop'),(13,1.2,'slam'),(13,2.6,'pop'),(13,4.2,'pop'),(14,.4,'pop'),(14,1.2,'whoosh'),(15,.6,'whoosh'),(15,2.6,'twang'),
 (16,.2,'pop'),(17,.4,'pop'),(17,1.6,'pop'),(17,3.0,'pop'),(18,.3,'slam'),(18,1.9,'slam'),(19,.4,'whoosh'),(19,2.0,'thud'),(19,2.6,'twang'),(19,4.0,'pop'),
 (20,.4,'pop'),(20,1.4,'pop'),(20,2.1,'pop'),(20,2.8,'pop'),(20,3.5,'pop'),(20,4.4,'slam'),(20,7.6,'pop'),(20,8.6,'stamp'),(21,.2,'pop'),(21,.7,'pop'),
 (22,.3,'whoosh'),(23,1.0,'whoosh'),(24,.3,'stamp'),(24,1.2,'whoosh'),(25,.5,'whoosh'),(25,2.6,'thud'),(26,.3,'slam'),(27,.4,'whoosh'),(27,3.4,'stamp'),(27,4.4,'pop'),(27,6.0,'pop'),(27,7.4,'pop'),
 (28,.4,'whoosh'),(28,1.4,'pop'),(28,2.4,'pop'),(28,3.3,'slam'),(29,.5,'pop'),(29,2.0,'pop'),(29,3.9,'thud'),(29,4.3,'twang'),(29,5.8,'pop'),(30,1.0,'whoosh'),
 (31,.3,'pop'),(31,1.0,'twang'),(31,1.6,'pop'),(31,3.3,'whoosh'),(31,3.9,'boom')]
sfx = [[k, round(starts[b] - .1 + o, 3)] for b, o, k in CUES]
# riding sections (soft hoof beat): (start, end)
hoof = [[starts[11] + .8, starts[11] + 6.6], [starts[24] + 1.0, starts[24] + 5.4], [starts[25] + .4, starts[25] + 3.4]]
json.dump({'times': {'end': end}, 'starts': starts, 'durs': durs, 'sfx': sfx, 'hoof': hoof}, open(f'{B}/timeline.json', 'w'), indent=1)
print('end', end, 'beats', len(starts))
