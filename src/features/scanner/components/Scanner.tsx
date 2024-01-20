import { RefObject } from "react";
import styles from "./Scanner.module.css";

type ScannerProps = {
  scannerRef: RefObject<HTMLDivElement>;
};

export default function Scanner({ scannerRef }: ScannerProps) {
  return <div ref={scannerRef} className={styles["barcode-scanner"]} />;
}
