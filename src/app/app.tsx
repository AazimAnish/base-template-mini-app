"use client";

import dynamic from "next/dynamic";

const SUSGame = dynamic(() => import("~/components/SUSGame"), {
  ssr: false,
});

export default function App() {
  return <SUSGame />;
}
