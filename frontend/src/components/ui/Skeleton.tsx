import styles from "./Skeleton.module.css";

export function Skeleton({ height = 72 }: { height?: number }) {
  return <div className={styles.block} style={{ height }} />;
}
