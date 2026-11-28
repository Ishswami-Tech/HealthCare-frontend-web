"use client";

// Dashboard page errors (including a session that ended mid-render) reuse the
// app error boundary, which sends ended sessions to login instead of showing
// "Something went wrong".
export { default } from "../error";
