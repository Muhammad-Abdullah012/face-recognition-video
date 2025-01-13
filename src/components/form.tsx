"use client";
import { FormEventHandler, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export const Form = () => {
  const [file1, setFile1] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasVideoRef = useRef<HTMLCanvasElement>(null);
  const canvasImageRef = useRef<HTMLCanvasElement>(null);
  const [videoDescriptor, setVideoDescriptor] = useState<Float32Array | null>(
    null
  );
  const [isVideoActive, setIsVideoActive] = useState(false);

  // Start the webcam video stream
  const startVideo = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsVideoActive(true);
      }
    }
  };

  // Stop the webcam video stream
  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsVideoActive(false);
    }
  };

  // Handle file upload for the image
  const handleFile1Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setFile1(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Detect face in the image and compare with video
  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const img1 = imgRef.current;
    const canvasImage = canvasImageRef.current;

    if (!img1 || !canvasImage) {
      setResult("Please upload an image.");
      return;
    }

    // Set canvas size to match the image dimensions
    canvasImage.width = img1.width;
    canvasImage.height = img1.height;

    // Detect face in the image
    const description = await faceapi
      .detectSingleFace(img1)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!description) {
      setResult("Face not detected in the uploaded image.");
      return;
    }

    const resizedDetections = faceapi?.resizeResults(description, {
      width: img1.width,
      height: img1.height,
    });
    // Draw detection and landmarks on the image
    const context = canvasImage.getContext("2d");
    if (context) context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    faceapi.draw.drawDetections(canvasImage, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvasImage, resizedDetections);

    // Compare with video descriptor
    console.log("videoDescriptor => ", videoDescriptor);
    if (videoDescriptor) {
      const distance = faceapi.euclideanDistance(
        resizedDetections.descriptor,
        videoDescriptor
      );

      // Set a threshold for determining if they are the same person
      const threshold = 0.6; // Lower value = stricter match
      if (distance < threshold) {
        setResult("The image and webcam video show the same person!");
      } else {
        setResult("The image and webcam video show different people.");
      }

      console.log("Euclidean Distance:", distance);
    } else {
      setResult("No face detected in the video.");
    }
  };

  // Track face in video
  useEffect(() => {
    const trackVideo = () => {
      if (!videoRef.current || !canvasVideoRef.current) return;

      const video = videoRef.current;
      const canvas = canvasVideoRef.current;

      canvas.width = video.width;
      canvas.height = video.height;

      const displaySize = {
        width: video.width,
        height: video.height,
      };

      return setInterval(async () => {
        if (isVideoActive) {
          const description = await faceapi
            .detectSingleFace(video)
            .withFaceLandmarks()
            .withFaceDescriptor()
            .withFaceExpressions();

          const resizedDetections = faceapi?.resizeResults(
            description,
            displaySize
          );

          // get 2d context and clear it from 0, 0, ...
          canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);

          if (resizedDetections) {
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

            // Update the video descriptor
            setVideoDescriptor(resizedDetections?.descriptor);
          } else {
            setVideoDescriptor(null);
          }
        }
      }, 100);
    };

    const interval = trackVideo();
    if (interval) return () => clearInterval(interval);
  }, [isVideoActive]);

  return (
    <form onSubmit={onSubmit}>
      {/* Upload for Image */}
      <input type="file" accept="image/*" onChange={handleFile1Upload} />
      {file1 && (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            ref={imgRef}
            src={file1}
            alt=""
            width={300}
            height={300}
            style={{ display: "block" }}
          />
          <canvas
            ref={canvasImageRef}
            width={300}
            height={300}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Webcam Video */}
      <div
        style={{ position: "relative", display: "inline-block", marginTop: 20 }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          width={300}
          height={300}
          style={{ display: "block", height: 300 }}
        />
        <canvas
          ref={canvasVideoRef}
          width={300}
          height={300}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Start/Stop Buttons */}
      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={startVideo} disabled={isVideoActive}>
          Start Video
        </button>
        <button type="button" onClick={stopVideo} disabled={!isVideoActive}>
          Stop Video
        </button>
      </div>

      <button type="submit" style={{ marginTop: 20 }}>
        Compare
      </button>

      {/* Result Display */}
      {result && <p>{result}</p>}
    </form>
  );
};
