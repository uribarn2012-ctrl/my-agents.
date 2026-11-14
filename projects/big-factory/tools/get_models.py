"""Downloads the free Kokoro voice model (~330 MB) into ./models"""
import os, urllib.request, numpy as np
M=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','models'); os.makedirs(M,exist_ok=True)
base='https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/'
urllib.request.urlretrieve(base+'onnx/model.onnx',os.path.join(M,'model.onnx'))
urllib.request.urlretrieve(base+'voices/am_michael.bin',os.path.join(M,'am_michael.bin'))
np.savez(os.path.join(M,'voices.npz'),am_michael=np.fromfile(os.path.join(M,'am_michael.bin'),dtype=np.float32).reshape(-1,1,256))
os.replace(os.path.join(M,'voices.npz'),os.path.join(M,'voices.bin')); print('models ready')
