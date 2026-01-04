import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { reportWebVitals } from './lib/webVitals';

// Render app immediately
createRoot(document.getElementById("root")!).render(<App />);

// Report web vitals after idle
reportWebVitals();
