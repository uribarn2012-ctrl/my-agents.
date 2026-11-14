"""Compute ch3/timeline.json from durs.json (narration start of every line) + sound-effect cues."""
import json, os
B = os.path.dirname(os.path.abspath(__file__))
durs = json.load(open(f'{B}/durs.json'))
GAP, LEAD, TAIL = 0.35, 0.7, 1.6
starts, t = [], LEAD
for d in durs:
    starts.append(round(t, 3)); t += d + GAP
end = round(t - GAP + TAIL, 3)
# sfx cues: (beat, offset-from-beat-start, kind). kinds are made in mix_audio.py
CUES = [(0,.4,'pop'),(0,1.0,'pop'),(1,.5,'pop'),(1,1.2,'whoosh'),(2,.3,'pop'),(3,.1,'slam'),(3,.3,'slam'),(3,.7,'pop'),(3,.85,'pop'),(3,1.0,'pop'),(3,1.15,'pop'),
 (4,.2,'pop'),(4,3.6,'whoosh'),(5,.6,'pop'),(5,6.0,'slam'),(5,6.1,'pop'),
 (6,.2,'pop'),(6,.5,'twang'),(6,1.6,'twang'),(6,2.6,'twang'),(7,.1,'pop'),(7,2.4,'pop'),(7,3.3,'pop'),(7,4.2,'pop'),(7,4.6,'pop'),(7,5.9,'slam'),(7,6.4,'stamp'),
 (8,.2,'pop'),(9,.0,'whoosh'),(9,.8,'pop'),(10,.0,'whoosh'),(10,1.9,'whoosh'),(10,3.1,'slam'),
 (11,.2,'pop'),(12,1.0,'pop'),(12,2.0,'pop'),(12,3.9,'pop'),(12,4.4,'pop'),(13,.2,'slam'),(13,.9,'whoosh'),(13,2.4,'whoosh'),(13,3.9,'whoosh'),
 (14,.15,'slam'),(15,2.8,'pop'),(15,3.5,'pop'),(15,4.2,'pop'),(15,6.0,'slam'),(15,6.5,'poof'),(15,6.75,'poof'),
 (16,.2,'whoosh'),(16,1.3,'poof'),(16,2.2,'pop'),(16,3.0,'pop'),(16,3.8,'pop'),(16,4.5,'pop'),(16,5.0,'slam'),
 (17,.2,'pop'),(17,.5,'whoosh'),(17,2.4,'pop'),(18,.3,'pop'),(18,1.0,'bonk'),(18,1.5,'bonk'),(19,.15,'pop'),(19,.8,'clunk'),(19,1.5,'clunk'),(19,2.2,'clunk'),(19,3.0,'clunk'),(19,2.6,'poof'),
 (20,.6,'thud'),(20,1.15,'thud'),(20,1.7,'thud'),(20,2.0,'pop'),(20,3.0,'slam'),(21,.15,'slam'),(21,.65,'slam'),(21,1.0,'pop'),
 (22,.4,'whoosh'),(22,2.0,'pop'),(22,2.4,'pop'),(22,3.0,'slam'),(23,.3,'pop'),(23,1.2,'pop'),(24,.2,'pop'),(24,.4,'pop'),(24,3.0,'pop'),
 (25,.2,'pop'),(25,.6,'whoosh'),(25,1.0,'pop'),(26,.6,'pop'),(26,1.5,'poof'),(26,1.7,'pop'),(26,2.4,'slam'),(26,3.0,'pop'),(27,.05,'pop'),
 (28,.3,'whoosh'),(28,.5,'pop'),(29,1.7,'pop'),(29,2.4,'pop'),(29,3.2,'pop'),(29,3.8,'pop'),(30,.6,'pop'),(30,.9,'pop'),(30,1.2,'pop'),(30,2.8,'thud'),(31,.1,'pop'),(31,3.2,'pop'),
 (32,.3,'pop'),(32,1.0,'pop'),(32,4.4,'whoosh'),(32,5.2,'pop'),(33,.35,'slam'),(33,2.6,'pop'),(33,4.4,'stamp'),(33,5.2,'pop'),
 (34,.2,'pop'),(34,.3,'slam'),(35,.3,'slam'),(35,.9,'pop'),(36,.2,'pop'),(36,.6,'pop'),(36,1.5,'pop'),
 (37,.3,'poof'),(37,.9,'poof'),(37,1.5,'poof'),(37,3.6,'whoosh'),(37,4.0,'splash'),(37,7.6,'pop'),(38,.7,'pop'),(38,.9,'twang'),(38,1.3,'pop'),(38,2.1,'pop'),(38,2.9,'pop'),
 (39,.4,'pop'),(39,1.2,'pop'),(39,1.9,'pop'),(42,.2,'pop'),(42,1.0,'whoosh'),(43,.3,'slam'),(43,1.2,'pop'),(43,1.6,'pop')]
sfx = [[k, round(starts[b] - .1 + o, 3)] for b, o, k in CUES]
# riding sections (soft hoof beat): (start, end)
hoof = [[starts[4] - .1, starts[5] + 6.5], [starts[6], starts[6] + 3.8], [starts[7], starts[7] + 5.9], [starts[13], starts[13] + 5], [starts[14], starts[14] + 4.5],
        [starts[25] + .6, starts[25] + 3.5], [starts[32] + 4.3, starts[32] + 8.4], [starts[35], starts[35] + 2.8], [starts[36], starts[36] + 4.2], [starts[37] + 2.2, starts[37] + 3.6]]
json.dump({'times': {'end': end}, 'starts': starts, 'durs': durs, 'sfx': sfx, 'hoof': hoof}, open(f'{B}/timeline.json', 'w'), indent=1)
print('end', end, 'beats', len(starts))
