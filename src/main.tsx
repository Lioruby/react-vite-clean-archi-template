import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./modules/global/react/App.tsx";
import { AppWrapper } from "./modules/app/react/AppWrapper.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </StrictMode>,
);
