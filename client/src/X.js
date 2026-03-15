import React from "react";
import { useAuth } from "./context/AuthContext";

export default function X() {
  const { p } = useAuth();
  p();
  return (
    <div>
      <p>hello</p>
    </div>
  );
}
