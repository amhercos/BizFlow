// Restores the global JSX namespace for libraries that still reference it.
declare namespace JSX {
  type Element = import("react").JSX.Element;
}
