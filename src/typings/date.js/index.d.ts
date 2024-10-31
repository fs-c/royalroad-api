// eslint-disable-next-line no-unused-vars
declare function date(str: string, offset?: number): Date;

declare module 'date.js' {
    export default date;
}
