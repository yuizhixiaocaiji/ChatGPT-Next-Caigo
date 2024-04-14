declare global {
  interface Window {
    dataLayer?: Object[];
    [key: string]: any;
  }
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export = content;
}
declare module "*.svg";
