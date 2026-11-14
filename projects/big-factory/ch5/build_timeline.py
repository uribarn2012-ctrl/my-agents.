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
CUES = [(0,.3,'pop'),(0,1.3,'pop'),(0,3.4,'slam'),(0,3.7,'whoosh'),(1,.5,'pop'),(1,.8,'pop'),(1,1.4,'pop'),(2,.9,'thud'),(2,1.3,'pop'),(2,2.6,'pop'),
 (3,.2,'whoosh'),(3,.5,'whoosh'),(3,.8,'whoosh'),(3,1.1,'whoosh'),(3,1.3,'pop'),(4,.2,'whoosh'),(4,2.5,'pop'),(4,5.3,'pop'),(4,7.1,'pop'),
 (5,.4,'whoosh'),(5,1.1,'pop'),(5,2.2,'pop'),(5,3.3,'pop'),(6,.3,'pop'),(6,1.6,'pop'),(6,3.2,'clunk'),(6,3.5,'slam'),
 (7,.8,'whoosh'),(7,1.2,'whoosh'),(7,3.0,'pop'),(7,3.4,'pop'),(8,.5,'boom'),(8,.7,'pop'),(8,.8,'pop'),(8,1.4,'pop'),(9,.5,'boom'),(9,.7,'pop'),(9,1.0,'pop'),(9,2.4,'pop'),
 (10,.2,'pop'),(10,.6,'slam'),(11,0,'pop'),(11,.2,'pop'),(11,1.6,'pop'),(11,2.8,'pop'),(12,.1,'whoosh'),(12,.4,'bonk'),(12,.9,'bonk'),(12,1.4,'bonk'),
 (13,.4,'pop'),(13,.7,'whoosh'),(13,3.4,'pop'),(14,.2,'clunk'),(14,.7,'clunk'),(14,1.2,'clunk'),(14,.9,'slam'),(15,.1,'slam'),(15,2.4,'pop'),
 (16,.1,'pop'),(16,1.4,'pop'),(16,1.5,'whoosh'),(16,1.9,'poke'),(17,.3,'pop'),(17,1.5,'slam'),(18,1.0,'whoosh'),(18,2.0,'pop'),(18,5.2,'pop'),(18,6.8,'pop'),
 (19,.5,'boom'),(19,1.5,'boom'),(19,3.0,'pop'),(19,4.0,'slam'),(19,5.0,'stamp'),(20,.4,'whoosh'),(20,1.2,'whoosh'),(20,1.4,'pop'),(20,3.6,'pop'),(21,.3,'slam'),(21,1.8,'pop'),
 (22,.1,'pop'),(22,.5,'pop'),(22,1.3,'pop'),(23,.2,'whoosh'),(23,.3,'slam'),(24,.4,'pop'),(24,1.2,'pop'),(24,2.0,'clunk'),(25,.5,'slam'),(25,1.8,'pop'),(25,3.4,'pop'),
 (26,.3,'whoosh'),(26,.5,'pop'),(27,.2,'whoosh'),(27,1.2,'slam'),(27,3.0,'pop'),(27,4.6,'pop'),(28,.4,'slam'),(28,1.6,'pop'),(28,3.4,'slam'),
 (29,.2,'pop'),(29,.6,'pop'),(29,.9,'pop'),(30,.1,'pop'),(30,1.0,'splash'),(31,.2,'pop'),(31,.5,'slam'),(32,.5,'slam'),(32,1.0,'pop'),(32,3.0,'pop'),
 (33,.3,'slam'),(33,.4,'pop'),(33,.75,'pop'),(33,1.1,'pop'),(33,1.45,'pop'),(34,.6,'pop'),(34,1.6,'pop')]
sfx = [[k, round(starts[b] - .1 + o, 3)] for b, o, k in CUES]
# riding sections (soft hoof beat): (start, end)
hoof = [[starts[4] - .1, starts[4] + 8.5], [starts[6], starts[6] + 3.8], [starts[17] - .1, starts[17] + 3.2], [starts[25], starts[25] + 5.5]]
json.dump({'times': {'end': end}, 'starts': starts, 'durs': durs, 'sfx': sfx, 'hoof': hoof}, open(f'{B}/timeline.json', 'w'), indent=1)
print('end', end, 'beats', len(starts))
