import { RefObject } from "react";
import styles from "./Scanner.module.css";

type ScannerProps = {
  scannerRef: RefObject<HTMLDivElement>;
};

const Scanner = ({ scannerRef }: ScannerProps) => {
  return <div ref={scannerRef} className={styles["barcode-scanner"]}></div>;
};

export default Scanner;
