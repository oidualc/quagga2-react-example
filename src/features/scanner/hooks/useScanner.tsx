import Quagga, {
  QuaggaJSConfigObject,
  QuaggaJSResultObject,
} from "@ericblade/quagga2";
import { useCallback, useEffect, useRef } from "react";
import { decoders } from "../config";

const useScanner = (onDetected: (code: string) => void) => {
  // It's important to only initialize Quagga when video track resources are correctly freed after a Quagga.stop()
  // otherwise it will open multiple camera streams that will not be closed when calling Quagga.stop()
  const isQuaggaInitBlockedRef = useRef(false);

  const scannerRef = useRef<HTMLDivElement | null>(null);

  const callback = (err: unknown) => {
    if (err) {
      return console.error("Error starting Quagga:", err);
    }
    if (scannerRef?.current) {
      Quagga.start();
    }
  };

  const errorCheck = useCallback(
    (result: QuaggaJSResultObject) => {
      if (!onDetected) {
        return;
      }

      const err = getMedianOfCodeErrors(result.codeResult.decodedCodes);

      // if Quagga is at least 75% certain that it read correctly, then accept the code.
      if ((err < 0.25 || isNaN(err)) && result.codeResult.code) {
        onDetected(result.codeResult.code);
      }
    },
    [onDetected]
  );

  const startScanner = async () => {
    if (!scannerRef.current) {
      throw new Error("Cannot start scanner without a target");
    } else if (isQuaggaInitBlockedRef.current) {
      throw new Error("Cannot init scanner while it is already running");
    }

    const config = getConfig(scannerRef.current);
    Quagga.init(config, callback);
    isQuaggaInitBlockedRef.current = true;

    Quagga.onDetected(errorCheck);
  };

  const stopScanner = useCallback(async () => {
    Quagga.offDetected(errorCheck);
    await Quagga.stop();
    isQuaggaInitBlockedRef.current = false;
  }, [errorCheck]);

  useEffect(() => {
    if (!isQuaggaInitBlockedRef.current && scannerRef.current != null) {
      const config = getConfig(scannerRef.current);
      Quagga.init(config, callback);
      isQuaggaInitBlockedRef.current = true;

      Quagga.onDetected(errorCheck);
    }
    return () => {
      stopScanner();
    };
  }, [errorCheck, stopScanner]);

  return { scannerRef, startScanner, stopScanner };
};

const getConfig = (target?: string | Element): QuaggaJSConfigObject => {
  return {
    inputStream: {
      type: "LiveStream",
      constraints: {
        width: {
          ideal: 1920,
          min: 640,
        },
        height: {
          ideal: 1080,
          min: 480,
        },
        facingMode: { ideal: "environment" },
      },
      target,
    },
    locator: {
      patchSize: "medium",
      halfSample: true,
    },
    numOfWorkers: 0,
    decoder: { readers: decoders },
    locate: true,
  };
};

const getMedian = (arr: number[]) => {
  arr.sort((a, b) => a - b);
  const half = Math.floor(arr.length / 2);
  if (arr.length % 2 === 1) {
    return arr[half];
  }
  return (arr[half - 1] + arr[half]) / 2;
};

const getMedianOfCodeErrors = (
  decodedCodes: QuaggaJSResultObject["codeResult"]["decodedCodes"]
) => {
  const errors = decodedCodes
    .filter((x) => x.error != null)
    .map((x) => x.error!);
  const medianOfErrors = getMedian(errors);
  return medianOfErrors;
};

export default useScanner;
