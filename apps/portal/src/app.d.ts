declare global {
  namespace App {
    interface Locals {
      portal: {
        id: number;
        accountId: number;
        name: string;
        slug: string;
        color: string | null;
        headerText: string | null;
        pageTitle: string | null;
      } | null;
    }
  }
}

export {};
