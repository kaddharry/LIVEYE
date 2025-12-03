import * as ort from 'onnxruntime-web'

// Configure ONNX Runtime to use local WASM files
// The files will be served from node_modules/onnxruntime-web/dist/
ort.env.wasm.wasmPaths = '/node_modules/onnxruntime-web/dist/'

// ===== CONFIGURABLE DETECTION PARAMETERS =====
const CONF_THRESHOLD = 0.15  // Minimum confidence score (0.0 - 1.0) - Lowered for ONNX models
const IOU_THRESHOLD = 0.45   // IoU threshold for NMS
const MAX_DETECTIONS = 3     // Maximum number of detections to show
const DEBUG_MODE = true      // Show debug logs for confidence scores

// Whitelist of allowed classes to reduce noise
// 0:person, 39:bottle, 41:cup, 45:bowl, 56:chair, 60:dining table, 
// 63:laptop, 64:mouse, 65:remote, 66:keyboard, 67:cell phone, 73:book
const ALLOWED_CLASSES = [0, 39, 41, 45, 56, 60, 63, 64, 65, 66, 67, 73]
// ==============================================

/**
 * Load ONNX model from URL
 * @param {string} modelPath - Path to the ONNX model file
 * @returns {Promise<ort.InferenceSession>} - Loaded model session
 */
export async function loadModel(modelPath) {
  try {
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    })
    console.log('Model loaded successfully')
    console.log('Input names:', session.inputNames)
    console.log('Output names:', session.outputNames)
    return session
  } catch (error) {
    console.error('Error loading model:', error)
    throw new Error(`Failed to load model: ${error.message}`)
  }
}

/**
 * Preprocess image from video, image, or canvas element to tensor
 * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} source - Source element
 * @param {number} inputWidth - Model input width
 * @param {number} inputHeight - Model input height
 * @returns {Object} - Preprocessed tensor and metadata
 */
function preprocessImage(source, inputWidth = 640, inputHeight = 640) {
  // Create canvas to capture frame
  const canvas = document.createElement('canvas')
  canvas.width = inputWidth
  canvas.height = inputHeight
  const ctx = canvas.getContext('2d')
  
  // Draw source to canvas
  ctx.drawImage(source, 0, 0, inputWidth, inputHeight)
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, inputWidth, inputHeight)
  const { data } = imageData
  
  // Convert to RGB and normalize to [0, 1]
  const redArray = []
  const greenArray = []
  const blueArray = []
  
  for (let i = 0; i < data.length; i += 4) {
    redArray.push(data[i] / 255.0)
    greenArray.push(data[i + 1] / 255.0)
    blueArray.push(data[i + 2] / 255.0)
  }
  
  // Create tensor [1, 3, height, width]
  const inputTensor = new ort.Tensor(
    'float32',
    [...redArray, ...greenArray, ...blueArray],
    [1, 3, inputHeight, inputWidth]
  )
  
  // Determine original dimensions based on source type
  let originalWidth, originalHeight
  if (source.videoWidth) {
    originalWidth = source.videoWidth
    originalHeight = source.videoHeight
  } else if (source.naturalWidth) {
    originalWidth = source.naturalWidth
    originalHeight = source.naturalHeight
  } else {
    originalWidth = source.width
    originalHeight = source.height
  }
  
  return {
    tensor: inputTensor,
    originalWidth,
    originalHeight,
    inputWidth,
    inputHeight
  }
}

/**
 * Decode YOLOv8 output and apply confidence filtering
 * @param {ort.Tensor} output - Raw model output tensor
 * @param {Object} metadata - Image metadata
 * @returns {Array} - Array of filtered detection objects
 */
function decodeYOLOOutput(output, metadata) {
  const { originalWidth, originalHeight, inputWidth, inputHeight } = metadata
  const boxes = []
  
  try {
    const outputData = output.data
    const dims = output.dims // e.g., [1, 36, 8400] or [1, 8400, 36]
    
    console.log('Output shape:', dims)
    
    let numBoxes, totalChannels, numClasses
    let transposed = false
    
    // Detect output format: [1, 36, 8400] or [1, 8400, 36]
    if (dims.length === 3) {
      if (dims[1] < dims[2]) {
        // Format: [1, 36, 8400] - need to transpose
        totalChannels = dims[1]
        numBoxes = dims[2]
        transposed = true
      } else {
        // Format: [1, 8400, 36] - no transpose needed
        numBoxes = dims[1]
        totalChannels = dims[2]
      }
      
      // Number of classes = total channels - 4 box coordinates
      numClasses = totalChannels - 4
      
      console.log(`Total channels: ${totalChannels}`)
      console.log(`Processing ${numBoxes} boxes, ${numClasses} classes`)
    } else {
      console.error('Unexpected output dimensions:', dims)
      return []
    }
    
    // Debug: Track top confidence scores
    let maxConfidenceFound = 0
    let topScores = []
    
    // Process each detection
    for (let i = 0; i < numBoxes; i++) {
      let boxData
      
      if (transposed) {
        // Extract data for box i from transposed format [1, totalChannels, numBoxes]
        boxData = []
        for (let j = 0; j < totalChannels; j++) {
          boxData.push(outputData[j * numBoxes + i])
        }
      } else {
        // Extract data for box i from format [1, numBoxes, totalChannels]
        const offset = i * totalChannels
        boxData = outputData.slice(offset, offset + totalChannels)
      }
      
      // First 4 values are box coordinates [cx, cy, w, h]
      const cx = boxData[0]
      const cy = boxData[1]
      const w = boxData[2]
      const h = boxData[3]
      
      // Remaining values are class scores (indices 4 to totalChannels-1)
      // Find best class from indices 4 to (4 + numClasses - 1)
      let maxScore = 0
      let maxClassIndex = 0
      
      for (let c = 4; c < 4 + numClasses; c++) {
        const classScore = boxData[c]
        if (classScore > maxScore) {
          maxScore = classScore
          maxClassIndex = c - 4 // Subtract 4 to get class index (0-based)
        }
      }
      
      // Track max confidence for debugging
      if (maxScore > maxConfidenceFound) {
        maxConfidenceFound = maxScore
      }
      
      // Keep track of top 5 scores for debugging
      if (DEBUG_MODE && topScores.length < 5) {
        topScores.push({ score: maxScore, classId: maxClassIndex, box: i })
      } else if (DEBUG_MODE && maxScore > topScores[topScores.length - 1].score) {
        topScores[topScores.length - 1] = { score: maxScore, classId: maxClassIndex, box: i }
        topScores.sort((a, b) => b.score - a.score)
      }
      
      // Apply confidence threshold AND class whitelist
      if (maxScore > CONF_THRESHOLD) {
        // Check if class is in whitelist
        if (ALLOWED_CLASSES.includes(maxClassIndex)) {
          // Convert from center format to corner format
          // Coordinates are relative to input size (640x640)
          const x1 = (cx - w / 2) / inputWidth * originalWidth
          const y1 = (cy - h / 2) / inputHeight * originalHeight
          const x2 = (cx + w / 2) / inputWidth * originalWidth
          const y2 = (cy + h / 2) / inputHeight * originalHeight
          
          boxes.push({
            x: Math.max(0, x1),
            y: Math.max(0, y1),
            width: Math.max(0, x2 - x1),
            height: Math.max(0, y2 - y1),
            confidence: maxScore,
            classId: maxClassIndex,
            label: COCO_CLASSES[maxClassIndex] || `Class ${maxClassIndex}`
          })
        }
      }
    }
    
    // Debug output
    if (DEBUG_MODE) {
      console.log(`Max confidence found: ${maxConfidenceFound.toFixed(4)}`)
      console.log('Top 5 scores:', topScores.map(s => `${s.score.toFixed(4)} (class ${s.classId})`).join(', '))
    }
    
    console.log(`Found ${boxes.length} boxes above confidence threshold ${CONF_THRESHOLD}`)
  } catch (error) {
    console.error('Error decoding YOLO output:', error)
    return []
  }
  
  return boxes
}

/**
 * Calculate Intersection over Union (IoU)
 * @param {Object} box1 - First bounding box
 * @param {Object} box2 - Second bounding box
 * @returns {number} - IoU value
 */
function calculateIoU(box1, box2) {
  const x1 = Math.max(box1.x, box2.x)
  const y1 = Math.max(box1.y, box2.y)
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width)
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height)
  
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const area1 = box1.width * box1.height
  const area2 = box2.width * box2.height
  const union = area1 + area2 - intersection
  
  if (union === 0) return 0
  return intersection / union
}

/**
 * Non-Maximum Suppression (NMS)
 * Keeps only the best detections and removes overlapping boxes
 * @param {Array} boxes - Array of bounding boxes
 * @returns {Array} - Filtered boxes after NMS
 */
function nonMaxSuppression(boxes) {
  if (boxes.length === 0) return []
  
  // Sort by confidence (descending)
  boxes.sort((a, b) => b.confidence - a.confidence)
  
  const selected = []
  const suppressed = new Set()
  
  for (let i = 0; i < boxes.length; i++) {
    if (suppressed.has(i)) continue
    
    const box = boxes[i]
    selected.push(box)
    
    // Suppress overlapping boxes
    for (let j = i + 1; j < boxes.length; j++) {
      if (suppressed.has(j)) continue
      
      const otherBox = boxes[j]
      
      // Only compare boxes of the same class
      if (box.classId === otherBox.classId) {
        const iou = calculateIoU(box, otherBox)
        if (iou > IOU_THRESHOLD) {
          suppressed.add(j)
        }
      }
    }
  }
  
  console.log(`NMS: ${boxes.length} boxes → ${selected.length} boxes`)
  return selected
}

/**
 * Limit detections to top K by confidence
 * @param {Array} boxes - Array of bounding boxes
 * @returns {Array} - Top K boxes
 */
function limitTopK(boxes) {
  if (boxes.length <= MAX_DETECTIONS) return boxes
  
  // Already sorted by confidence in NMS
  const topK = boxes.slice(0, MAX_DETECTIONS)
  console.log(`Limiting to top ${MAX_DETECTIONS} detections`)
  return topK
}

/**
 * Run inference on video frame
 * @param {ort.InferenceSession} session - Loaded model session
 * @param {HTMLVideoElement} video - Video element
 * @returns {Promise<Array>} - Array of detections
 */
export async function runInference(session, video) {
  try {
    // Preprocess
    const { tensor, originalWidth, originalHeight, inputWidth, inputHeight } = 
      preprocessImage(video, 640, 640)
    
    // Run inference
    const feeds = {}
    feeds[session.inputNames[0]] = tensor
    const results = await session.run(feeds)
    
    // Get output
    const output = results[session.outputNames[0]]
    
    // Decode YOLO output and filter by confidence
    let boxes = decodeYOLOOutput(output, {
      originalWidth,
      originalHeight,
      inputWidth,
      inputHeight
    })
    
    // Apply Non-Maximum Suppression
    boxes = nonMaxSuppression(boxes)
    
    // Limit to top K detections
    boxes = limitTopK(boxes)
    
    return boxes
  } catch (error) {
    console.error('Inference error:', error)
    return []
  }
}

// COCO dataset class names (80 classes)
const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
  'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book',
  'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

