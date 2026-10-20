import { useLocation } from "react-router-dom";
import styles from "./index.module.css";

/**
 * Wraps routed content and replays a subtle enter animation on navigation.
 * Keyed by pathname so the animation restarts when the page changes.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className={styles.transition}>
      {children}
    </div>
  );
}
