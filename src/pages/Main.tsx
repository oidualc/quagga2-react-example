import { useCallback, useState } from "react";
import Scanner from "../features/scanner/components/Scanner";
import useScanner from "../features/scanner/hooks/useScanner";
import styles from "./Main.module.css";

export default function Main() {
  const [play, setPlay] = useState(true);
  const [code, setCode] = useState<string | null>(null);

  const onDetected = useCallback((code: string) => setCode(code), []);

  const { scannerRef, startScanner, stopScanner } = useScanner(
    onDetected,
    true,
  );

  const onClick = () => {
    if (play) {
      stopScanner();
    } else {
      startScanner();
    }

    setPlay(!play);
  };

  const detectedText = code
    ? `Detected code: ${code}`
    : play
      ? "Scanning..."
      : "Stopped";

  return (
    <main>
      <section className={styles.section}>
        <button onClick={onClick}>Start / Stop</button>

        {detectedText}

        <div className={styles["scan-area"]}>
          <Scanner scannerRef={scannerRef} />
        </div>
      </section>
    </main>
  );
}
