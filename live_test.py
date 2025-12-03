from ultralytics import YOLO
import cv2

model = YOLO("best_ccs.pt")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Webcam could not be opened!")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    results = model(frame)
    annotated = results[0].plot()

    cv2.imshow("Live YOLO Detection", annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
