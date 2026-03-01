"""Smart Turn v3.2 detector wrapper for LiveKit Agents.

Since LiveKit Agents v1.4 doesn't have a native smart-turn plugin,
we implement it as a post-VAD filter that analyzes audio segments
to determine if the user's turn has truly ended.

The detector:
1. Collects PCM audio frames during user speech
2. When VAD signals silence, runs the Smart Turn model
3. Returns probability that the turn is complete
4. Agent uses this to decide whether to respond or wait
"""

import os
import logging
import numpy as np

logger = logging.getLogger("smart-turn")

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
# Prefer GPU model, fall back to CPU
GPU_MODEL = os.path.join(MODEL_DIR, "smart-turn-v3.2-gpu.onnx")
CPU_MODEL = os.path.join(MODEL_DIR, "smart-turn-v3.2-cpu.onnx")


class SmartTurnDetector:
    """Intelligent turn detection using Smart Turn v3.2 ONNX model.

    Call `predict(audio_array)` with 16kHz mono float32 PCM.
    Returns dict with 'prediction' (0=incomplete, 1=complete) and 'probability'.
    """

    def __init__(self, threshold: float = 0.5, use_gpu: bool = True):
        self.threshold = threshold
        self._session = None
        self._feature_extractor = None
        self._model_path = GPU_MODEL if (use_gpu and os.path.exists(GPU_MODEL)) else CPU_MODEL

        if not os.path.exists(self._model_path):
            logger.warning(f"Smart Turn model not found at {self._model_path}. Detector disabled.")
            self._available = False
            return

        try:
            import onnxruntime as ort
            from transformers import WhisperFeatureExtractor

            so = ort.SessionOptions()
            so.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
            so.inter_op_num_threads = 1
            so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

            # Try GPU first, fall back to CPU
            providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if use_gpu else ["CPUExecutionProvider"]
            self._session = ort.InferenceSession(self._model_path, sess_options=so, providers=providers)
            self._feature_extractor = WhisperFeatureExtractor(chunk_length=8)
            self._available = True
            actual_provider = self._session.get_providers()[0]
            logger.info(f"Smart Turn v3.2 loaded ({actual_provider}), threshold={threshold}")
        except Exception as e:
            logger.warning(f"Smart Turn init failed: {e}. Detector disabled.")
            self._available = False

    @property
    def available(self) -> bool:
        return self._available

    def predict(self, audio_array: np.ndarray) -> dict:
        """Predict whether a speech segment is complete.

        Args:
            audio_array: 16kHz mono float32 PCM numpy array

        Returns:
            {"prediction": 0|1, "probability": float}
            prediction=1 means turn is complete (user is done speaking)
        """
        if not self._available:
            return {"prediction": 1, "probability": 1.0}  # Default: assume complete

        # Truncate to last 8 seconds or pad
        target_len = 8 * 16000  # 8 seconds at 16kHz
        if len(audio_array) > target_len:
            audio_array = audio_array[-target_len:]
        elif len(audio_array) < target_len:
            padding = np.zeros(target_len - len(audio_array), dtype=np.float32)
            audio_array = np.concatenate([padding, audio_array])

        # Extract features
        inputs = self._feature_extractor(
            audio_array,
            sampling_rate=16000,
            return_tensors="np",
            padding="max_length",
            max_length=target_len,
            truncation=True,
            do_normalize=True,
        )

        input_features = inputs.input_features.squeeze(0).astype(np.float32)
        input_features = np.expand_dims(input_features, axis=0)

        # Run inference
        outputs = self._session.run(None, {"input_features": input_features})
        probability = outputs[0][0].item()
        prediction = 1 if probability > self.threshold else 0

        logger.debug(f"Smart Turn: prob={probability:.3f} pred={prediction}")
        return {"prediction": prediction, "probability": probability}
