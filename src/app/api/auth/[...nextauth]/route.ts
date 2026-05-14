import { handlers } from "@/auth";

// Expose the NextAuth GET and POST handlers at /api/auth/*
export const { GET, POST } = handlers;
