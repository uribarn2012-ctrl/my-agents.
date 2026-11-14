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
CUES = [(0,.4,'pop'),(0,1.2,'pop'),(0,2.0,'pop'),(1,.2,'pop'),(1,.8,'pop'),(1,1.5,'whoosh'),(2,.4,'whoosh'),(2,3.4,'pop'),(2,6.9,'pop'),(2,7.2,'pop'),
 (3,.2,'slam'),(3,.5,'pop'),(4,.5,'pop'),(4,1.9,'pop'),(4,3.4,'pop'),(5,.4,'slam'),(5,1.0,'pop'),
 (6,.3,'pop'),(6,1.0,'pop'),(6,1.8,'pop'),(6,2.6,'pop'),(6,3.4,'pop'),(6,4.2,'pop'),(6,4.9,'pop'),(7,1.3,'poof'),(7,2.7,'poof'),(7,4.1,'poof'),(7,1.0,'whoosh'),(7,2.4,'whoosh'),(7,3.8,'whoosh'),
 (8,.5,'slam'),(8,1.4,'pop'),(8,3.5,'whoosh'),(8,3.9,'pop'),(8,5.3,'pop'),(8,5.8,'whoosh'),(9,.3,'pop'),(9,.7,'slam'),(9,.9,'whoosh'),
 (10,.4,'pop'),(10,2.0,'whoosh'),(10,3.0,'poof'),(10,3.1,'pop'),(10,3.3,'pop'),(10,3.6,'pop'),(11,.4,'pop'),(11,1.2,'pop'),(11,1.6,'pop'),(12,.2,'clunk'),(12,.5,'pop'),(12,1.3,'pop'),(12,2.1,'slam'),
 (13,.3,'whoosh'),(13,.6,'slam'),(13,1.0,'pop'),(13,2.0,'stamp'),(14,.5,'pop'),(14,1.0,'twang'),(15,.2,'pop'),(15,1.2,'pop'),(15,1.9,'pop'),(15,3.0,'pop'),(15,4.4,'pop'),
 (16,.5,'pop'),(16,1.6,'pop'),(17,.3,'pop'),(17,1.4,'pop'),(17,2.2,'pop'),(17,3.0,'pop'),(17,3.8,'pop'),(17,4.6,'pop'),(18,.4,'pop'),(18,1.2,'pop'),(18,2.4,'slam'),(18,3.3,'pop'),(18,3.7,'pop'),
 (19,.4,'pop'),(19,2.1,'pop'),(19,3.9,'pop'),(20,.5,'pop'),(20,1.4,'pop'),(20,2.3,'pop'),(20,3.1,'pop'),(21,.4,'pop'),(21,2.0,'pop'),(21,3.4,'pop'),(21,6.3,'pop'),
 (22,.2,'slam'),(22,.4,'pop'),(23,.3,'whoosh'),(23,1.6,'pop'),(23,2.4,'pop'),(24,.5,'pop'),(24,1.2,'bonk'),(24,1.9,'bonk'),(24,2.6,'bonk'),(24,3.3,'pop'),(24,4.0,'bonk'),(25,.2,'pop'),(25,1.0,'whoosh'),(25,1.5,'twang'),
 (26,.5,'splash'),(26,1.7,'splash'),(26,3.1,'splash'),(26,4.2,'splash'),(26,4.6,'pop'),(26,5.0,'pop'),(26,5.2,'pop'),(26,5.7,'stamp'),
 (27,.2,'slam'),(27,.4,'pop'),(28,.4,'pop'),(28,.9,'pop'),(28,2.5,'pop'),(28,4.1,'pop'),(28,5.7,'pop'),(28,6.8,'pop'),(28,7.8,'pop'),(29,.3,'pop'),(29,.6,'pop'),(30,.2,'slam'),(30,.5,'bonk'),(30,.8,'bonk'),(31,.3,'pop'),(31,.8,'clunk'),(31,1.1,'clunk'),(31,1.4,'pop'),
 (32,.4,'slam'),(32,1.4,'pop'),(32,2.8,'whoosh'),(33,.9,'pop'),(33,1.3,'pop'),(33,1.7,'pop'),(33,2.1,'pop'),(33,3.1,'slam'),(34,.6,'whoosh'),(34,2.4,'pop'),(34,3.4,'pop'),(34,4.0,'pop'),(34,4.7,'pop')]
sfx = [[k, round(starts[b] - .1 + o, 3)] for b, o, k in CUES]
# riding sections (soft hoof beat): (start, end)
hoof = [[starts[4] - .1, starts[4] + 8.2], [starts[7] - .1, starts[7] + 5.6], [starts[9] - .1, starts[9] + 2.8]]
json.dump({'times': {'end': end}, 'starts': starts, 'durs': durs, 'sfx': sfx, 'hoof': hoof}, open(f'{B}/timeline.json', 'w'), indent=1)
print('end', end, 'beats', len(starts))
