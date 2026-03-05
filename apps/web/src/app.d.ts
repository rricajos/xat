/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Locals {
      user: import("$lib/server/auth").SessionUser | null;
      account: import("$lib/server/auth").SessionAccount | null;
    }

    interface Error {
      message: string;
      code?: string;
    }
  }
}

export {};
