// Static image asset modules so `import x from './foo.png'` is typed (metro
// resolves these to an asset id usable as a React Native Image `source`).
declare module '*.png' {
  const content: number;
  export default content;
}
declare module '*.jpg' {
  const content: number;
  export default content;
}
declare module '*.jpeg' {
  const content: number;
  export default content;
}
declare module '*.gif' {
  const content: number;
  export default content;
}
declare module '*.webp' {
  const content: number;
  export default content;
}
