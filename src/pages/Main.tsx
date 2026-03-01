import Quagga, {
  QuaggaJSCodeReader,
  QuaggaJSConfigObject,
  QuaggaJSResultCallbackFunction,
  QuaggaJSResultObject,
} from "@ericblade/quagga2";
import { useEffect, useRef, useState } from "react";
import styles from "./Main.module.css";

export default function Main() {
  const scannerRef = useRef<HTMLDivElement | null>(null);

  const [scannerState, setScannerState] = useState<"scanning" | "stopped">("scanning");

  const [code, setCode] = useState<string | null>(null);

  // It's important to only initialize Quagga when video track resources are
  // correctly freed after a Quagga.stop() otherwise it will open multiple
  // camera streams that are not closed when Quagga.stop() is called
  const quaggaInitializingRef = useRef(false);

  const handleDetected: QuaggaJSResultCallbackFunction = ({ codeResult }) => {
    if (canAcceptScanResult(codeResult.decodedCodes) && codeResult.code) {
      setCode(codeResult.code);
    }
  };

  const startScanner = async () => {
    if (scannerState != "stopped") {
      throw new Error("Cannot init scanner while it is already running");
    }

    await startQuagga(scannerRef.current!, handleDetected);
    setScannerState("scanning")
  };

  const stopScanner = async () => {
    await stopQuagga(handleDetected);
    setScannerState("stopped");
  };

  useEffect(() => {
    const init = async () => {
      if (quaggaInitializingRef.current) {
        console.warn("Scanner is already running, skipping initialization");
        return;
      }

      quaggaInitializingRef.current = true;
      await startQuagga(scannerRef.current!, handleDetected);
      quaggaInitializingRef.current = false;

      setScannerState("scanning");
    }

    const stop = async () => {
      if (quaggaInitializingRef.current) {
        console.warn("Scanner is initializing, skipping stop");
        return;
      }

      await stopQuagga(handleDetected, () => {
        setScannerState("stopped");
      });
    }

    init();

    return () => {
      stop();
    };
  }, []);

  return (
    <main>
      <section className={styles.section}>
        {scannerState == "scanning" ? (
          <button onClick={stopScanner}>Stop</button>
        ) : (
          <button onClick={startScanner}>Start</button>
        )}

        <DecodedText code={code} scanning={scannerState == "scanning"} />

        <div className={styles["scan-area"]}>
          <div ref={scannerRef} className={styles["barcode-scanner"]} />
        </div>
      </section>
    </main>
  );
}

function DecodedText({
  code,
  scanning,
}: {
  code: string | null;
  scanning: boolean;
}) {
  if (code) {
    return <p>Detected code: {code}</p>;
  } else if (scanning) {
    return <p>Scanning...</p>;
  } else {
    return <p>Stopped</p>;
  }
}

function buildConfig(target: string | Element): QuaggaJSConfigObject {
  const DECODER_READERS: QuaggaJSCodeReader[] = [
    "code_39_reader",
    "code_128_reader",
  ];

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
    decoder: { readers: DECODER_READERS },
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

async function startQuagga(
  target: Element,
  detectHandler: QuaggaJSResultCallbackFunction,
) {
  const config = buildConfig(target);

  await Quagga.start(config);
  Quagga.onDetected(detectHandler);
}

async function stopQuagga(detectHandler: QuaggaJSResultCallbackFunction, onStopped?: () => void) {
  await Quagga.stop();
  Quagga.offDetected(detectHandler);

  onStopped?.();
}

function canAcceptScanResult(
  decodedCodes: QuaggaJSResultObject["codeResult"]["decodedCodes"],
) {
  const err = getAvgOfErrorCodes(decodedCodes);

  // if Quagga is at least 75% certain that it read correctly, then accept the code.
  return err < 0.25 || isNaN(err);
}
