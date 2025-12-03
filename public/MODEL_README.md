# Placeholder for ONNX Model

Please replace this file with your actual YOLO ONNX model.

The model should be in ONNX format (.onnx extension) and compatible with YOLO architecture.

You can export a YOLO model to ONNX format using:
- YOLOv5: `python export.py --weights yolov5s.pt --include onnx`
- YOLOv8: `yolo export model=yolov8n.pt format=onnx`

Recommended models:
- YOLOv5s (small, faster)
- YOLOv8n (nano, fastest)
- YOLOv8s (small, balanced)

Make sure the model input size matches the preprocessing in onnxUtils.js (default: 640x640).
