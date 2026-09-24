"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="statusPage"><div><span>ERROR</span><h1>Something didn't load correctly.</h1><p>Your source file has not been changed. Try the page again, or return to the studio.</p><nav><button type="button" onClick={() => reset()}>Try again</button><a href="/">Return home</a></nav></div></main>;
}
