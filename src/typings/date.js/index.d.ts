declare function date(str: string, offset?: number): Date;

declare module 'date.js' {
  export = date;
}