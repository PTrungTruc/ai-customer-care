'use client';

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import EmbedSync from "./EmbedSync";

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <EmbedSync />
      {/* <div className="flex h-screen overflow-hidden">
        <div className="w-full max-w-md p-8">
          {children}
        </div>
      </div> */}
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex flex-col w-full h-full">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}