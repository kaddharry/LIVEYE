import * as ort from "onnxruntime-web";

ort.env.wasm.wasmPaths = "/onnx/";
ort.env.wasm.simd = true;
ort.env.wasm.numThreads = 1;
