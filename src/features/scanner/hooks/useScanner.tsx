import Quagga, {
  QuaggaJSConfigObject,
  QuaggaJSResultObject,
} from "@ericblade/quagga2";
import { useCallback, useEffect, useRef } from "react";
import { decoders } from "../config";

export default function useScanner(
  onDetected: (code: string) => void,
  autoStart = false,
) {
  // It's important to only initialize Quagga when video track resources are
  // correctly freed after a Quagga.stop() otherwise it will open multiple
  // camera streams that are not closed when Quagga.stop() is called
  const isQuaggaInitBlockedRef = useRef(false);

  const scannerRef = useRef<HTMLDivElement | null>(null);

  const handleDetected = useCallback(
    ({ codeResult }: QuaggaJSResultObject) => {
      const err = getAvgOfErrorCodes(codeResult.decodedCodes);

      // if Quagga is at least 75% certain that it read correctly, then accept the code.
      if ((err < 0.25 || isNaN(err)) && codeResult.code) {
        onDetected(codeResult.code);
      }
    },
    [onDetected],
  );

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) {
      throw new Error("Cannot start scanner without a target");
    } else if (isQuaggaInitBlockedRef.current) {
      throw new Error("Cannot init scanner while it is already running");
    }

    const config = getConfig(scannerRef.current);
    Quagga.init(config, (err: unknown) => {
      if (err) {
        alert(`Error starting Quagga: ${err}`);
        return;
      }

      Quagga.start();
    });
    isQuaggaInitBlockedRef.current = true;

    Quagga.onDetected((data) => handleDetected(data));
  }, [handleDetected]);

  const stopScanner = useCallback(async () => {
    Quagga.offDetected(handleDetected);
    await Quagga.stop();
    isQuaggaInitBlockedRef.current = false;
  }, [handleDetected]);

  useEffect(() => {
    if (!autoStart || isQuaggaInitBlockedRef.current || !scannerRef.current) {
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [autoStart, startScanner, stopScanner]);

  return { scannerRef, startScanner, stopScanner };
}

function getConfig(target: string | Element): QuaggaJSConfigObject {
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
}

function getAvgOfErrorCodes(
  decodedCodes: QuaggaJSResultObject["codeResult"]["decodedCodes"],
) {
  const errors = decodedCodes
    .filter((x) => x.error != null)
    .map((x) => x.error!);
  const avgOfErrors = errors.reduce((a, b) => a + b) / errors.length;
  return avgOfErrors;
}
