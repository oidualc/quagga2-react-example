import Quagga, {
  QuaggaJSConfigObject,
  QuaggaJSResultObject,
} from "@ericblade/quagga2";
import { useEffect, useRef } from "react";
import { decoders } from "../config";

const useScanner = (onDetected: (code: string) => void) => {
  const isQuaggaInitializedRef = useRef(false);

  const scannerRef = useRef<HTMLDivElement | null>(null);

  const callback = (err: unknown) => {
    if (err) {
      return console.error("Error starting Quagga:", err);
    }
    if (scannerRef?.current) {
      Quagga.start();
    }
  };

  const errorCheck = (result: QuaggaJSResultObject) => {
    if (!onDetected) {
      return;
    }

    const err = getMedianOfCodeErrors(result.codeResult.decodedCodes);

    // if Quagga is at least 75% certain that it read correctly, then accept the code.
    if ((err < 0.25 || isNaN(err)) && result.codeResult.code) {
      onDetected(result.codeResult.code);
    }
  };

  const startScanner = async () => {
    await Quagga.init(getConfig(scannerRef.current ?? undefined), callback);
    Quagga.onDetected(errorCheck);
  };

  const stopScanner = async () => {
    Quagga.offDetected(errorCheck);
    await Quagga.stop();
  };

  useEffect(() => {
    if (!isQuaggaInitializedRef.current) {
      // It's important to initialize Quagga only once, otherwise it will open
      // multiple camera streams that will not be closed when calling Quagga.stop()
      Quagga.init(getConfig(scannerRef.current ?? undefined), callback);
      isQuaggaInitializedRef.current = true;
    }
    Quagga.onDetected(errorCheck);
    return () => {
      stopScanner();
    };
  }, [onDetected]);

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
