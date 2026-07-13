type SanityPerspective = import("@sanity/client").ClientPerspective;

declare namespace App {
  interface Locals {
    draftMode: boolean;
    editorMode: boolean;
    perspective?: SanityPerspective;
  }
}
