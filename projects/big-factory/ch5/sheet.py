import sys
from PIL import Image
ts=[float(x) for x in sys.argv[2:]]
ims=[Image.open(f'test_frames/f_{t:06.2f}.png').resize((640,360)) for t in ts]
W=Image.new('RGB',(1920,360*((len(ims)+2)//3)))
for i,im in enumerate(ims):W.paste(im,((i%3)*640,(i//3)*360))
W.save(sys.argv[1])
