import type {XRExtras} from '../xrextras'

declare global {
  interface Window {
    XR8: any;
    XRExtras: typeof XRExtras;
    THREE: any;
  }
}
