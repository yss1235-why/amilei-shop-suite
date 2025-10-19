declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: any);
    text(text: string, x: number, y: number, options?: any): void;
    setFontSize(size: number): void;
    setTextColor(r: number, g: number, b: number): void;
    setDrawColor(r: number, g: number, b: number): void;
    setFont(font: string | undefined, style: string): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    save(filename: string): void;
    internal: {
      pageSize: {
        width: number;
        height: number;
      };
    };
  }
}

declare module 'jspdf-autotable' {
  export default function autoTable(doc: any, options: any): void;
}
