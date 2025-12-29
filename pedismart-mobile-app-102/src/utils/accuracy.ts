

export function sendAccuracyMetric(
  emit: Function,
  metric: string,
  isCorrect: boolean,
  context?: any
) {
  try {
    emit("accuracyEvent", {
      metric,
      isCorrect,
      timestamp: Date.now(),
      context: context || {},
    });
  } catch (e) {
   
    console.warn("Accuracy metric failed:", metric);
  }
}
