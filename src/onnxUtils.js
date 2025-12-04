import * as ort from "onnxruntime-web";

// FORCE WASM FILES TO LOAD FROM PUBLIC/onnx/
ort.env.wasm.wasmPaths = "./onnx/";
ort.env.wasm.simd = true;
ort.env.wasm.numThreads = 1;
