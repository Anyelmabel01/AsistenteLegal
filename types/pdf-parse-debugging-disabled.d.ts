declare module 'pdf-parse-debugging-disabled' {
  interface PdfData {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }
  function parse(buffer: Buffer): Promise<PdfData>;
  export default parse;
}