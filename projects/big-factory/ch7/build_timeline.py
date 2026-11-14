"""Compute timeline.json from durs.json (narration start of every line) + sound-effect cues."""
import json, os
B = os.path.dirname(os.path.abspath(__file__))
durs = json.load(open(f'{B}/durs.json'))
GAP, LEAD, TAIL = 0.85, 0.9, 2.0
starts, t = [], LEAD
for d in durs:
    starts.append(round(t, 3)); t += d + GAP
end = round(t - GAP + TAIL, 3)
# sfx cues: (beat, offset-from-beat-start, kind). kinds are made in mix_audio.py
CUES = [(0,.4,'pop'),(0,1.5,'pop'),(0,2.6,'pop'),(0,3.6,'whoosh'),(1,.4,'pop'),(1,2.0,'pop'),(1,3.8,'pop'),(2,.9,'whoosh'),(2,1.4,'slam'),(2,2.7,'pop'),(2,3.3,'pop'),
 (3,.35,'stamp'),(3,.7,'pop'),(3,1.7,'pop'),(3,5.3,'pop'),(3,5.7,'pop'),(3,6.5,'pop'),(4,.5,'pop'),(4,1.0,'whoosh'),(5,.2,'pop'),(5,1.5,'whoosh'),(5,3.1,'slam'),(5,3.4,'bonk'),(5,4.0,'pop'),(6,.3,'pop'),(6,.7,'pop'),(6,1.1,'pop'),(6,3.0,'slam'),
 (7,.3,'pop'),(7,.9,'slam'),(7,1.8,'pop'),(8,.5,'pop'),(8,2.0,'whoosh'),(8,2.9,'pop'),(9,.3,'pop'),(9,.8,'pop'),(10,.4,'pop'),(10,.7,'slam'),(11,.2,'pop'),(11,.9,'pop'),(12,.4,'pop'),(12,1.2,'slam'),(12,2.2,'pop'),(12,4.0,'pop'),(12,4.4,'pop'),
 (13,.7,'pop'),(13,1.0,'pop'),(13,2.7,'pop'),(13,3.0,'pop'),(14,.4,'whoosh'),(14,.9,'slam'),(15,.4,'pop'),(15,.8,'pop'),(15,1.2,'pop'),(16,.4,'pop'),(16,.7,'pop'),(16,1.0,'pop'),(17,.3,'pop'),(17,.6,'slam'),
 (18,.5,'pop'),(18,.8,'whoosh'),(18,3.0,'whoosh'),(19,1.7,'poof'),(19,2.2,'twang'),(19,5.0,'whoosh'),(19,5.7,'pop'),(19,7.6,'splash'),(19,8.4,'splash'),(19,9.2,'slam'),(19,10.0,'slam'),
 (20,.4,'whoosh'),(20,1.5,'whoosh'),(20,2.7,'pop'),(20,3.9,'pop'),(21,.7,'clunk'),(21,1.5,'clunk'),(21,2.3,'clunk'),(21,3.2,'pop'),(21,4.3,'bonk'),(21,5.1,'bonk'),(22,.3,'pop'),(22,.8,'bonk'),(22,1.4,'bonk'),
 (23,.4,'slam'),(23,1.4,'boom'),(23,2.3,'splash'),(23,2.7,'splash'),(23,3.0,'whoosh'),(23,3.2,'pop'),(24,.5,'pop'),(24,1.4,'poke'),(24,4.5,'pop'),(24,5.3,'stamp'),
 (25,.6,'pop'),(25,1.6,'pop'),(25,2.8,'pop'),(25,4.0,'pop'),(25,5.7,'pop'),(26,.3,'slam'),(26,1.1,'slam'),(27,.3,'pop'),(27,.75,'pop'),(27,1.2,'pop'),(27,1.65,'pop'),(28,.2,'slam'),(28,.6,'pop'),(28,1.0,'pop'),(28,1.4,'pop'),(28,3.0,'pop'),
 (29,.3,'pop'),(29,1.9,'pop'),(29,2.1,'whoosh'),(30,.3,'pop'),(30,1.3,'pop'),(30,2.3,'pop'),(30,3.3,'pop'),(30,4.3,'pop'),(30,5.3,'pop'),(31,.5,'slam'),(31,.8,'pop'),(31,1.6,'pop'),(32,.3,'pop'),(32,.6,'pop'),(32,.9,'pop'),(32,3.3,'pop'),
 (33,.4,'thud'),(34,.4,'thud'),(34,1.4,'poof'),(35,.3,'pop'),(36,.3,'pop'),(36,3.1,'pop'),(36,5.5,'thud'),(37,.4,'pop'),(37,1.6,'thud'),(37,3.0,'twang'),(37,4.6,'thud'),(37,5.4,'twang'),(38,.3,'pop'),(38,.8,'pop'),(38,1.3,'pop'),(39,.4,'whoosh'),(39,3.0,'thud'),(39,4.2,'thud'),(40,.7,'clunk'),(40,1.0,'clunk'),(40,1.3,'clunk'),(40,2.5,'slam')]
sfx = [[k, round(starts[b] - .1 + o, 3)] for b, o, k in CUES]
# riding sections (soft hoof beat): (start, end)
hoof = [[starts[0] + 1.0, starts[0] + 4.8], [starts[14] - .1, starts[14] + 3.4]]
json.dump({'times': {'end': end}, 'starts': starts, 'durs': durs, 'sfx': sfx, 'hoof': hoof}, open(f'{B}/timeline.json', 'w'), indent=1)
print('end', end, 'beats', len(starts))
