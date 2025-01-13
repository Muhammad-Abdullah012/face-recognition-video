"use client";
import { useEffect } from "react";
import * as faceapi from "face-api.js";
import { toast } from "react-toastify";

export const LoadModels = () => {
  useEffect(() => {
    (async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.loadSsdMobilenetv1Model(MODEL_URL),
        faceapi.loadFaceLandmarkModel(MODEL_URL),
        faceapi.loadFaceRecognitionModel(MODEL_URL),
        faceapi.loadFaceExpressionModel(MODEL_URL),
      ])
        .then(() => toast.success("Models loaded successfully"))
        .catch((error) => {
          toast.error("Failed to load model");
          console.error(error);
        });
    })();
  }, []);
  return <></>;
};
